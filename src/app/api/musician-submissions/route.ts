import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import nodemailer from 'nodemailer';
import {
  FORM_TOKEN_ERRORS,
  checkFormToken,
  getFormSecret,
  isHoneypotFilled,
  turnstileConfigured,
  verifyTurnstile,
} from '@/lib/antispam';
import {
  TEXT_FIELD_KEYS,
  allQuestions,
  resolveMusicianForm,
  type ResolvedMusicianForm,
  type ResolvedQuestion,
} from '@/lib/musicianForm';

/**
 * Réception des fiches musiciens envoyées depuis /musiciens/contribuer.
 *
 * Les questions posées sont réglées dans l'admin (global « Formulaire
 * musiciens »). Cette route lit la même configuration que le formulaire :
 * une question retirée n'est plus enregistrée même si elle est envoyée à la
 * main, et une question marquée obligatoire est exigée ici aussi — un contrôle
 * côté navigateur ne protège rien.
 */

const ALLOWED_PHOTO_MIMETYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
/** Garde-fou contre les envois massifs ; largement au-dessus d'une fiche normale. */
const MAX_FIELD_LENGTH = 10_000;

/** Champs dont la valeur s'écrit sur plusieurs lignes dans l'e-mail d'alerte. */
const MULTILINE_KEYS = new Set(['bio', 'formation', 'concours']);

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
}

async function loadForm(payload: Awaited<ReturnType<typeof getPayloadClient>>) {
  try {
    return resolveMusicianForm(await payload.findGlobal({ slug: 'musician-form' as any }));
  } catch {
    // Global jamais enregistré ou table absente : formulaire d'origine.
    return resolveMusicianForm(null);
  }
}

export async function POST(req: NextRequest) {
  try {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return badRequest('Requête invalide.');
    }

    const get = (key: string): string => {
      const value = formData.get(key);
      return typeof value === 'string' ? value.trim() : '';
    };

    // 1. Pot de miel : un humain ne voit pas ce champ. On répond « succès » sans
    //    rien enregistrer, pour ne pas renseigner le robot.
    if (isHoneypotFilled(formData.get('website'))) {
      return NextResponse.json({ success: true });
    }

    // 2. Jeton signé au rendu de la page : formulaire réellement chargé, et pas
    //    rempli en moins de 3 secondes.
    const tokenStatus = checkFormToken(get('formToken'), getFormSecret());
    if (tokenStatus !== 'ok') {
      return badRequest(FORM_TOKEN_ERRORS[tokenStatus]);
    }

    // Captcha Cloudflare Turnstile, si configuré (mêmes clés que le formulaire de
    // contact). Le pot de miel et le jeton signé restent en place en dessous.
    if (turnstileConfigured()) {
      const result = await verifyTurnstile(
        get('turnstileToken'),
        process.env.TURNSTILE_SECRET_KEY as string,
        clientIp(req),
      );
      if (!result.success) {
        console.warn('Musician form: Turnstile refusé', result.errorCodes);
        return badRequest('La vérification anti-robot a échoué. Merci de réessayer.');
      }
    }

    // La collection refuse les créations anonymes via l'API publique (REST/GraphQL) ;
    // ici on passe par l'API locale, hors contrôle d'accès.
    const payload = await getPayloadClient();
    const form: ResolvedMusicianForm = await loadForm(payload);
    const questions: ResolvedQuestion[] = allQuestions(form);

    if (TEXT_FIELD_KEYS.some((key) => get(key).length > MAX_FIELD_LENGTH)) {
      return badRequest('Un des champs est trop long.');
    }

    const photoFile = formData.get('photo');
    const hasPhoto = photoFile instanceof File && photoFile.size > 0;

    // 3. Questions obligatoires, telles que réglées dans l'admin.
    for (const question of questions) {
      if (!question.required) continue;
      const answered = question.kind === 'photo' ? hasPhoto : get(question.key) !== '';
      if (!answered) {
        return badRequest(`La question « ${question.label} » est obligatoire.`);
      }
    }

    const firstName = get('firstName');
    const lastName = get('lastName');
    const fullName = `${firstName} ${lastName}`.trim();

    // 4. Réponses conservées : uniquement celles que le formulaire demande.
    const submissionData: Record<string, unknown> = { name: fullName, status: 'nouveau' };
    let sectionLabel = '';

    for (const question of questions) {
      if (question.kind === 'photo') continue;

      if (question.kind === 'section') {
        const value = get(question.key);
        const choice = question.choices?.find((c) => c.value === value);
        if (choice) {
          submissionData.section = choice.value;
          sectionLabel = choice.label;
        }
        continue;
      }

      const value = get(question.key);
      if (!value) continue;

      if (question.key === 'instagram') {
        submissionData.instagram = value
          .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '@')
          .replace(/^([^@])/, '@$1');
        continue;
      }

      submissionData[question.key] = value;
    }

    // 5. Photo, si la question est posée.
    const photoAsked = questions.some((q) => q.kind === 'photo');
    if (photoAsked && hasPhoto) {
      const file = photoFile as File;
      if (!ALLOWED_PHOTO_MIMETYPES.has(file.type)) {
        return badRequest('Format de photo non accepté. Utilisez JPG, PNG ou WebP.');
      }
      if (file.size > MAX_PHOTO_BYTES) {
        return badRequest('Photo trop volumineuse (max 10 Mo).');
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const media = await payload.create({
        collection: 'media' as any,
        data: { alt: `Photo — ${fullName}` } as any,
        file: {
          name: file.name || 'photo.jpg',
          data: buffer,
          mimetype: file.type,
          size: file.size,
        },
        overrideAccess: true,
      });
      submissionData.photo = (media as any).id;
    }

    await payload.create({
      collection: 'musician-submissions' as any,
      data: submissionData,
      overrideAccess: true,
    });

    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // L'e-mail reprend les questions du formulaire, dans le même ordre.
      const lines: string[] = ['Nouvelle fiche reçue via le formulaire musicien :', ''];
      for (const question of questions) {
        if (question.kind === 'photo') {
          lines.push(`${question.label} : ${submissionData.photo ? 'oui (téléversée)' : 'non fournie'}`);
          continue;
        }
        const value =
          question.kind === 'section' ? sectionLabel : (submissionData[question.key] as string);
        if (!value) continue;
        lines.push(
          MULTILINE_KEYS.has(question.key)
            ? `${question.label} :\n${value}\n`
            : `${question.label} : ${value}`,
        );
      }

      const to = process.env.CONTACT_EMAIL || process.env.SMTP_USER;
      await transporter.sendMail({
        from: `"La Chambre Symphonique" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        replyTo: get('email') || undefined,
        subject: `[Fiche musicien] ${fullName}`,
        text: lines.join('\n'),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Musician submission error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 },
    );
  }
}
