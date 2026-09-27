import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { getMemberSession } from '@/lib/memberSession';
import { mailConfigured, sendMail, teamNotificationEmail } from '@/lib/mail';
import {
  MAX_LINES,
  PROFILE_FIELDS,
  comparable,
  normalizeInstagram,
  toMusicianValue,
  type ProfileFieldName,
} from '@/lib/profileFields';

/**
 * Proposition de modification de fiche, envoyée depuis /espace-membres/fiche.
 *
 * Rien n'est écrit dans la fiche musicien : on enregistre une proposition
 * (collection profile-changes) avec les seuls champs qui diffèrent de la
 * fiche en ligne. Une seule proposition en attente par personne : un nouvel
 * envoi la remplace ; un envoi identique à la fiche en ligne la retire.
 */

const ALLOWED_PHOTO_MIMETYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
/** Sous la limite de 4,5 Mo que Vercel impose au corps d'une requête. */
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

type Payload = Awaited<ReturnType<typeof getPayloadClient>>;

/** Supprime une photo envoyée pour une proposition, si la fiche ne l'utilise pas. */
async function dropPendingPhoto(payload: Payload, photoId: string, musicianPhotoId: string) {
  if (!photoId || photoId === musicianPhotoId) return;
  try {
    await payload.delete({ collection: 'media' as any, id: photoId, overrideAccess: true });
  } catch {
    // Photo déjà supprimée ou utilisée ailleurs : on la laisse.
  }
}

export async function POST(req: NextRequest) {
  // Le cookie de session est SameSite=Lax ; on refuse en plus tout envoi venu d'un autre site.
  const origin = req.headers.get('origin');
  if (origin && origin !== req.nextUrl.origin) return fail('Requête refusée.', 403);

  const session = await getMemberSession();
  if (!session) return fail('Votre session a expiré. Reconnectez-vous pour envoyer vos modifications.', 401);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail('Requête invalide. Si vous avez joint une photo, vérifiez qu’elle fait moins de 4 Mo.');
  }

  // 1. Valeurs proposées, contrôlées champ par champ.
  const proposed: Partial<Record<ProfileFieldName, string>> = {};
  for (const field of PROFILE_FIELDS) {
    if (field.kind === 'photo') continue;
    const raw = form.get(field.name);
    if (typeof raw !== 'string') continue; // champ absent : inchangé
    let value = raw.replace(/\r\n/g, '\n').trim();
    if (field.kind === 'lines') {
      const items = value.split('\n').map((l) => l.trim()).filter(Boolean);
      if (items.length > MAX_LINES) return fail(`${field.label} : ${MAX_LINES} lignes au plus.`);
      if (items.some((l) => l.length > field.max)) return fail(`${field.label} : ${field.max} caractères au plus par ligne.`);
      value = items.join('\n');
    } else if (value.length > field.max) {
      return fail(`${field.label} : ${field.max} caractères au plus.`);
    }
    if (field.kind === 'url' && value && !/^https?:\/\/\S+$/i.test(value)) {
      return fail(`${field.label} : indiquez un lien complet, qui commence par https://`);
    }
    if (field.name === 'instagram') value = normalizeInstagram(value);
    proposed[field.name] = value;
  }
  if (proposed.name === '') return fail('Le nom ne peut pas être vide.');

  const file = form.get('photo');
  const newPhoto = file instanceof File && file.size > 0 ? file : null;
  if (newPhoto && !ALLOWED_PHOTO_MIMETYPES.has(newPhoto.type)) {
    return fail('Format de photo non accepté. Utilisez JPG, PNG ou WebP.');
  }
  if (newPhoto && newPhoto.size > MAX_PHOTO_BYTES) return fail('Photo trop lourde : 4 Mo au plus.');

  // 2. Comparaison avec la fiche en ligne et la proposition déjà en attente.
  const payload = await getPayloadClient();
  const musician = (await payload.findByID({
    collection: 'musicians' as any,
    id: session.musician.id,
    depth: 0,
  })) as any;
  const pendingResult = await payload.find({
    collection: 'profile-changes' as any,
    where: { musician: { equals: musician.id }, status: { equals: 'en-attente' } } as any,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const pending = pendingResult.docs[0] as any;
  const musicianPhoto = comparable('photo', musician.photo);
  const pendingPhoto = pending?.changedFields?.includes('photo') ? comparable('photo', pending.photo) : '';

  const changed: ProfileFieldName[] = [];
  const base: Record<string, string> = {};
  for (const [name, value] of Object.entries(proposed) as [ProfileFieldName, string][]) {
    const current = comparable(name, musician[name]);
    if (value !== current) {
      changed.push(name);
      base[name] = current;
    }
  }

  let photoId = pendingPhoto;
  if (newPhoto) {
    const media = await payload.create({
      collection: 'media' as any,
      data: { alt: `Photo — ${proposed.name || musician.name}` } as any,
      file: {
        name: newPhoto.name || 'photo.jpg',
        data: Buffer.from(await newPhoto.arrayBuffer()),
        mimetype: newPhoto.type,
        size: newPhoto.size,
      },
      overrideAccess: true,
    });
    photoId = String((media as any).id);
  }
  if (photoId) {
    changed.push('photo');
    base.photo = musicianPhoto;
  }

  if (changed.length === 0) {
    if (!pending) return fail('Aucune différence avec votre fiche en ligne : rien à envoyer.');
    await dropPendingPhoto(payload, pendingPhoto, musicianPhoto);
    await payload.delete({ collection: 'profile-changes' as any, id: pending.id, overrideAccess: true });
    return NextResponse.json({
      success: true,
      message: 'Votre fiche en ligne correspond déjà à ce formulaire : la proposition en attente a été retirée.',
    });
  }

  // 3. Enregistrement : les champs non modifiés sont vidés, pour ne rien garder d'un envoi précédent.
  const data: Record<string, unknown> = {
    title: proposed.name || musician.name,
    musician: musician.id,
    account: session.account.id,
    status: 'en-attente',
    submittedAt: new Date().toISOString(),
    decidedAt: null,
    reviewNote: null,
    changedFields: changed,
    base,
  };
  for (const field of PROFILE_FIELDS) {
    if (field.kind === 'photo') continue;
    data[field.name] = changed.includes(field.name)
      ? toMusicianValue(field.name, proposed[field.name] ?? '')
      : field.kind === 'lines'
        ? []
        : null;
  }
  data.photo = photoId ? toMusicianValue('photo', photoId) : null;

  let saved: any;
  if (pending) {
    if (newPhoto) await dropPendingPhoto(payload, pendingPhoto, musicianPhoto);
    saved = await payload.update({ collection: 'profile-changes' as any, id: pending.id, data: data as any, overrideAccess: true });
  } else {
    saved = await payload.create({ collection: 'profile-changes' as any, data: data as any, overrideAccess: true });
  }

  // 4. Alerte à l'équipe, si l'envoi d'e-mails est configuré.
  const to = teamNotificationEmail();
  if (mailConfigured()) {
    const labels = PROFILE_FIELDS.filter((f) => changed.includes(f.name)).map((f) => `- ${f.label}`);
    try {
      await sendMail({
        to,
        subject: `[Espace membres] Modification de fiche — ${data.title}`,
        text: [
          `${data.title} propose de modifier sa fiche${pending ? ' (nouvel envoi, qui remplace le précédent)' : ''} :`,
          ...labels,
          '',
          `À relire puis appliquer ou refuser : ${req.nextUrl.origin}/admin/collections/profile-changes/${saved.id}`,
        ].join('\n'),
      });
    } catch (err) {
      console.error('Alerte modification de fiche :', err);
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Merci ! Votre proposition est envoyée : l’équipe la relira avant de la publier.',
  });
}
