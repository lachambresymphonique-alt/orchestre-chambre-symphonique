import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { CONTACT_RECIPIENTS, mailConfigured, sendMail } from '@/lib/mail';
import { SITE_URL } from '@/lib/siteUrl';
import {
  FORM_TOKEN_ERRORS,
  checkCaptcha,
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
const MAX_PHONE_LENGTH = 30;
// Chiffres, espaces, points, tirets, parenthèses et « + » international ; au moins 6 chiffres.
const PHONE_PATTERN = /^\+?[\d\s().-]+$/;

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
    const { website, formToken, turnstileToken, captchaToken, captchaAnswer } = body ?? {};

    // 1. Pot de miel : un humain ne voit pas ce champ. On répond « succès » sans
    //    rien enregistrer, pour ne pas renseigner le robot.
    if (isHoneypotFilled(website)) {
      return NextResponse.json({ success: true });
    }

    // 2. Champs
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const subject = typeof body?.subject === 'string' ? body.subject : '';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!name || !email || !phone || !subject || !message) {
      return badRequest('Tous les champs sont requis.');
    }
    if (!Object.prototype.hasOwnProperty.call(SUBJECT_LABELS, subject)) {
      return badRequest('Objet invalide.');
    }
    if (!EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL_LENGTH) {
      return badRequest('Adresse e-mail invalide.');
    }
    if (
      phone.length > MAX_PHONE_LENGTH ||
      !PHONE_PATTERN.test(phone) ||
      phone.replace(/\D/g, '').length < 6
    ) {
      return badRequest('Numéro de téléphone invalide.');
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

    // 4. Captcha : Cloudflare Turnstile s'il est configuré, sinon la question
    //    posée dans le formulaire.
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
    } else if (!checkCaptcha(captchaToken, captchaAnswer, getFormSecret())) {
      return badRequest('La réponse à la question anti-robot est incorrecte.');
    }

    // 5. Enregistrement. La collection refuse les créations anonymes via l'API
    //    publique (REST/GraphQL) ; ici on passe par l'API locale, hors contrôle d'accès.
    const payload = await getPayloadClient();
    const saved = await payload.create({
      collection: 'contact-submissions' as any,
      data: { name, email, phone, subject, message },
      overrideAccess: true,
    });

    // 6. Alerte e-mail aux deux boîtes de l'orchestre. Le message est déjà
    //    enregistré dans l'admin : un échec d'envoi ne doit pas faire croire à
    //    l'internaute que rien n'est parti (il renverrait un doublon).
    if (mailConfigured()) {
      const subjectLabel = SUBJECT_LABELS[subject] || subject;
      const siteHost = new URL(SITE_URL).host;
      try {
        await sendMail({
          to: CONTACT_RECIPIENTS,
          replyTo: email,
          subject: `[Site web] Message de ${name} : ${subjectLabel}`,
          text: [
            `Message envoyé depuis le formulaire de contact du site ${siteHost}`,
            `(${SITE_URL}/contact).`,
            '',
            `Nom : ${name}`,
            `E-mail : ${email}`,
            `Téléphone : ${phone}`,
            `Objet : ${subjectLabel}`,
            '',
            'Message :',
            message,
            '',
            '—',
            `Pour répondre, utilisez simplement « Répondre » : la réponse ira à ${email}.`,
            `Dans l'admin : ${SITE_URL}/admin/collections/contact-submissions/${(saved as any).id}`,
          ].join('\n'),
        });
      } catch (err) {
        console.error('Contact form: e-mail non envoyé', err);
      }
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
