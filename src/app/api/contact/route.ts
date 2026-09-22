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

const SUBJECT_LABELS: Record<string, string> = {
  info: "Demande d'information",
  reservation: 'Réservation / Billetterie',
  mecenat: 'Mécénat / Partenariat',
  presse: 'Presse / Médias',
  programmation: 'Programmation / Booking',
  benevolat: 'Bénévolat',
  autre: 'Autre',
};

const MAX_NAME_LENGTH = 200;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 5_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { website, formToken, turnstileToken } = body ?? {};

    // 1. Pot de miel : un humain ne voit pas ce champ. On répond « succès » sans
    //    rien enregistrer, pour ne pas renseigner le robot.
    if (isHoneypotFilled(website)) {
      return NextResponse.json({ success: true });
    }

    // 2. Champs
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const subject = typeof body?.subject === 'string' ? body.subject : '';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!name || !email || !subject || !message) {
      return badRequest('Tous les champs sont requis.');
    }
    if (!Object.prototype.hasOwnProperty.call(SUBJECT_LABELS, subject)) {
      return badRequest('Objet invalide.');
    }
    if (!EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL_LENGTH) {
      return badRequest('Adresse e-mail invalide.');
    }
    if (name.length > MAX_NAME_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
      return badRequest('Message trop long.');
    }

    // 3. Jeton signé au rendu de la page : formulaire réellement chargé, et pas
    //    rempli en moins de 3 secondes.
    const tokenStatus = checkFormToken(formToken, getFormSecret());
    if (tokenStatus !== 'ok') {
      return badRequest(FORM_TOKEN_ERRORS[tokenStatus]);
    }

    // 4. Captcha Cloudflare Turnstile, si configuré.
    if (turnstileConfigured()) {
      const result = await verifyTurnstile(
        turnstileToken,
        process.env.TURNSTILE_SECRET_KEY as string,
        clientIp(req),
      );
      if (!result.success) {
        console.warn('Contact form: Turnstile refusé', result.errorCodes);
        return badRequest('La vérification anti-robot a échoué. Merci de réessayer.');
      }
    }

    // 5. Enregistrement. La collection refuse les créations anonymes via l'API
    //    publique (REST/GraphQL) ; ici on passe par l'API locale, hors contrôle d'accès.
    const payload = await getPayloadClient();
    await payload.create({
      collection: 'contact-submissions' as any,
      data: { name, email, subject, message },
      overrideAccess: true,
    });

    // 6. Notification e-mail si SMTP est configuré
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
      const subjectLabel = SUBJECT_LABELS[subject] || subject;

      await transporter.sendMail({
        from: `"La Chambre Symphonique" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        replyTo: email,
        subject: `[Contact] ${subjectLabel} — ${name}`,
        text: [
          `Nom : ${name}`,
          `E-mail : ${email}`,
          `Objet : ${subjectLabel}`,
          '',
          message,
        ].join('\n'),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 },
    );
  }
}
