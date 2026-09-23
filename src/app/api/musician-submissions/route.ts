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

const ALLOWED_SECTIONS = new Set(['direction', 'cordes', 'vents', 'claviers']);
const ALLOWED_PHOTO_MIMETYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
/** Garde-fou contre les envois massifs ; largement au-dessus d'une fiche normale. */
const MAX_FIELD_LENGTH = 10_000;

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
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

    const firstName = get('firstName');
    const lastName = get('lastName');
    const email = get('email');
    const role = get('role');
    if (!firstName || !lastName || !email || !role) {
      return badRequest('Le prénom, le nom, l\'e-mail et le rôle sont obligatoires.');
    }

    const textFields = [
      'firstName', 'lastName', 'email', 'phone', 'instagram', 'role', 'instrument',
      'bio', 'inspiringSymphony', 'favoriteWork', 'favoriteComposer', 'formation',
      'concours', 'videoUrl',
    ];
    if (textFields.some((key) => get(key).length > MAX_FIELD_LENGTH)) {
      return badRequest('Un des champs est trop long.');
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const rawInstagram = get('instagram');
    const instagram = rawInstagram
      ? rawInstagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '@').replace(/^([^@])/, '@$1')
      : undefined;

    const submissionData: Record<string, unknown> = {
      firstName,
      lastName,
      name: fullName,
      email,
      phone: get('phone') || undefined,
      instagram,
      role,
      instrument: get('instrument') || undefined,
      bio: get('bio') || undefined,
      inspiringSymphony: get('inspiringSymphony') || undefined,
      favoriteWork: get('favoriteWork') || undefined,
      favoriteComposer: get('favoriteComposer') || undefined,
      formation: get('formation') || undefined,
      concours: get('concours') || undefined,
      videoUrl: get('videoUrl') || undefined,
      status: 'nouveau',
    };
    const section = get('section');
    if (section && ALLOWED_SECTIONS.has(section)) {
      submissionData.section = section;
    }

    // La collection refuse les créations anonymes via l'API publique (REST/GraphQL) ;
    // ici on passe par l'API locale, hors contrôle d'accès.
    const payload = await getPayloadClient();

    // Optional photo upload
    const photoFile = formData.get('photo');
    if (photoFile && photoFile instanceof File && photoFile.size > 0) {
      if (!ALLOWED_PHOTO_MIMETYPES.has(photoFile.type)) {
        return badRequest('Format de photo non accepté. Utilisez JPG, PNG ou WebP.');
      }
      if (photoFile.size > MAX_PHOTO_BYTES) {
        return badRequest('Photo trop volumineuse (max 10 Mo).');
      }

      const buffer = Buffer.from(await photoFile.arrayBuffer());
      const media = await payload.create({
        collection: 'media' as any,
        data: { alt: `Photo — ${fullName}` } as any,
        file: {
          name: photoFile.name || 'photo.jpg',
          data: buffer,
          mimetype: photoFile.type,
          size: photoFile.size,
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

      const to = process.env.CONTACT_EMAIL || process.env.SMTP_USER;
      await transporter.sendMail({
        from: `"La Chambre Symphonique" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        replyTo: email,
        subject: `[Fiche musicien] ${fullName}`,
        text: [
          `Nouvelle fiche reçue via le formulaire musicien :`,
          ``,
          `Prénom : ${firstName}`,
          `Nom : ${lastName}`,
          `E-mail : ${email}`,
          submissionData.phone ? `Téléphone : ${submissionData.phone}` : null,
          submissionData.instagram ? `Instagram : ${submissionData.instagram}` : null,
          `Rôle : ${role}`,
          submissionData.instrument ? `Instrument : ${submissionData.instrument}` : null,
          submissionData.section ? `Section : ${submissionData.section}` : null,
          submissionData.photo ? `Photo : oui (téléversée)` : `Photo : non fournie`,
          ``,
          submissionData.bio ? `Biographie :\n${submissionData.bio}` : null,
          ``,
          submissionData.inspiringSymphony ? `Symphonie qui a donné envie : ${submissionData.inspiringSymphony}` : null,
          submissionData.favoriteWork ? `Œuvre préférée : ${submissionData.favoriteWork}` : null,
          submissionData.favoriteComposer ? `Compositeur préféré : ${submissionData.favoriteComposer}` : null,
          ``,
          submissionData.formation ? `Formation :\n${submissionData.formation}` : null,
          ``,
          submissionData.concours ? `Concours :\n${submissionData.concours}` : null,
          ``,
          submissionData.videoUrl ? `Vidéo : ${submissionData.videoUrl}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
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
