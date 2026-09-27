import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getPayloadClient } from '@/lib/payload';
import { isAdminUser } from '@/lib/access';
import { mailConfigured, sendMail } from '@/lib/mail';
import { INVITATION_TTL_MS, firstName, loginLink, newLoginToken } from '@/lib/memberSession';

/**
 * Invitation à l'espace membres, depuis la fiche d'un musicien dans l'admin
 * (bouton « Inviter à l'espace membres », src/components/admin/InviteMemberButton.tsx).
 *
 * GET  ?musicianId=… : état de l'accès et adresse suggérée (la plus récente
 *      fiche reçue au même nom, lue par l'API locale : le REST de
 *      musician-submissions est masqué par la route publique du formulaire).
 * POST { musicianId, email } : crée ou met à jour l'accès, émet un lien valable
 *      14 jours, l'envoie par e-mail si le SMTP est configuré et le renvoie
 *      toujours à l'admin, qui peut le transmettre lui-même.
 *
 * Réservé aux administrateurs.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Payload = Awaited<ReturnType<typeof getPayloadClient>>;

async function requireAdmin(payload: Payload): Promise<boolean> {
  try {
    const { user } = await payload.auth({ headers: await headers() });
    return isAdminUser(user);
  } catch {
    return false;
  }
}

async function findMusician(payload: Payload, id: unknown) {
  if (typeof id !== 'string' && typeof id !== 'number') return null;
  try {
    return (await payload.findByID({ collection: 'musicians' as any, id, depth: 0 })) as any;
  } catch {
    return null;
  }
}

async function findAccountBy(payload: Payload, field: 'musician' | 'email', value: unknown) {
  const result = await payload.find({
    collection: 'member-accounts' as any,
    where: { [field]: { equals: value } } as any,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return (result.docs[0] as any) ?? null;
}

function publicAccount(account: any) {
  if (!account) return null;
  return {
    id: account.id,
    email: account.email,
    status: account.status,
    invitedAt: account.invitedAt ?? null,
    lastLoginAt: account.lastLoginAt ?? null,
  };
}

export async function GET(req: NextRequest) {
  const payload = await getPayloadClient();
  if (!(await requireAdmin(payload))) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }
  const musician = await findMusician(payload, req.nextUrl.searchParams.get('musicianId'));
  if (!musician) return NextResponse.json({ error: 'Fiche introuvable.' }, { status: 404 });

  const account = await findAccountBy(payload, 'musician', musician.id);
  let suggestedEmail: string | null = null;
  if (!account) {
    try {
      const submissions = await payload.find({
        collection: 'musician-submissions' as any,
        where: { name: { equals: musician.name } } as any,
        sort: '-createdAt',
        limit: 1,
        depth: 0,
      });
      suggestedEmail = (submissions.docs[0] as any)?.email ?? null;
    } catch {
      suggestedEmail = null;
    }
  }

  return NextResponse.json({
    account: publicAccount(account),
    suggestedEmail,
    mailConfigured: mailConfigured(),
  });
}

export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  if (!(await requireAdmin(payload))) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }

  let body: { musicianId?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  }
  const musician = await findMusician(payload, body.musicianId);
  if (!musician) return NextResponse.json({ error: 'Fiche introuvable.' }, { status: 404 });

  const existing = await findAccountBy(payload, 'musician', musician.id);
  const sameEmail = await findAccountBy(payload, 'email', email);
  if (sameEmail && sameEmail.id !== existing?.id) {
    const other = await findMusician(payload, sameEmail.musician);
    return NextResponse.json(
      { error: `Cette adresse donne déjà accès à la fiche de ${other?.name || 'quelqu’un d’autre'}.` },
      { status: 409 },
    );
  }

  const { token, hash } = newLoginToken();
  const now = new Date();
  const data = {
    email,
    musician: musician.id,
    // Réinviter un compte désactivé le rouvre : c'est le geste explicite de l'admin.
    status: existing?.status === 'actif' ? 'actif' : 'invite',
    invitedAt: now.toISOString(),
    loginTokenHash: hash,
    loginTokenExpiresAt: new Date(now.getTime() + INVITATION_TTL_MS).toISOString(),
    loginTokenIssuedAt: now.toISOString(),
  };

  let account: any;
  try {
    account = existing
      ? await payload.update({ collection: 'member-accounts' as any, id: existing.id, data: data as any, overrideAccess: true })
      : await payload.create({ collection: 'member-accounts' as any, data: data as any, overrideAccess: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Enregistrement impossible.' }, { status: 500 });
  }

  const link = loginLink(req.nextUrl.origin, token);
  let emailed = false;
  let mailError: string | null = null;
  if (mailConfigured()) {
    const hello = firstName(musician.name);
    try {
      await sendMail({
        to: email,
        subject: 'Votre espace membre — La Chambre Symphonique',
        text: [
          `Bonjour${hello ? ` ${hello}` : ''},`,
          '',
          'Vous êtes invité·e à rejoindre l’espace membres du site de La Chambre Symphonique, où vous retrouverez votre fiche.',
          '',
          'Pour vous connecter, ouvrez ce lien (valable 14 jours) :',
          link,
          '',
          `Ensuite, il suffira de saisir votre adresse e-mail sur ${req.nextUrl.origin}/espace-membres pour recevoir un nouveau lien : aucun mot de passe à retenir.`,
          '',
          'Si vous n’attendiez pas ce message, ignorez-le simplement.',
          '',
          '— La Chambre Symphonique',
        ].join('\n'),
      });
      emailed = true;
    } catch (err: any) {
      mailError = err?.message || 'Envoi impossible.';
    }
  }

  return NextResponse.json({ account: publicAccount(account), link, emailed, mailError });
}
