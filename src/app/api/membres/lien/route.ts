import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import {
  FORM_TOKEN_ERRORS,
  checkFormToken,
  getFormSecret,
  isHoneypotFilled,
  turnstileConfigured,
  verifyTurnstile,
} from '@/lib/antispam';
import { mailConfigured, sendMail } from '@/lib/mail';
import {
  LOGIN_LINK_THROTTLE_MS,
  LOGIN_LINK_TTL_MS,
  firstName,
  loginLink,
  newLoginToken,
} from '@/lib/memberSession';

/**
 * Demande d'un lien de connexion depuis /espace-membres.
 *
 * La réponse est la même que l'adresse corresponde à un compte ou non : ce
 * formulaire ne doit pas servir à deviner qui fait partie de l'orchestre.
 * Mêmes protections que les formulaires publics (pot de miel, jeton signé,
 * Turnstile si configuré), plus un lien par minute au plus par compte.
 */

const SENT = {
  success: true,
  message:
    'Si cette adresse correspond à un compte, un lien de connexion vient de lui être envoyé. Il est valable 30 minutes.',
};

function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  if (isHoneypotFilled(body.website)) return NextResponse.json(SENT);

  const tokenStatus = checkFormToken(body.formToken, getFormSecret());
  if (tokenStatus !== 'ok') {
    return NextResponse.json({ error: FORM_TOKEN_ERRORS[tokenStatus] }, { status: 400 });
  }

  if (turnstileConfigured()) {
    const check = await verifyTurnstile(body.turnstileToken, process.env.TURNSTILE_SECRET_KEY!, clientIp(req));
    if (!check.success) {
      return NextResponse.json(
        { error: 'La vérification anti-robot a échoué. Merci de réessayer.' },
        { status: 400 },
      );
    }
  }

  // Avant toute recherche : la réponse ne doit pas dépendre de l'adresse saisie.
  if (!mailConfigured()) {
    return NextResponse.json(
      { error: 'L’envoi des liens de connexion n’est pas encore en service. Contactez l’orchestre pour recevoir le vôtre.' },
      { status: 503 },
    );
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254) {
    return NextResponse.json({ error: 'Indiquez votre adresse e-mail.' }, { status: 400 });
  }

  try {
    const payload = await getPayloadClient();
    const found = await payload.find({
      collection: 'member-accounts' as any,
      where: { email: { equals: email }, status: { in: ['invite', 'actif'] } } as any,
      limit: 1,
      depth: 1,
      overrideAccess: true,
    });
    const account = found.docs[0] as any;
    if (!account || !account.musician) return NextResponse.json(SENT);

    const now = Date.now();
    const lastIssued = account.loginTokenIssuedAt ? Date.parse(account.loginTokenIssuedAt) : 0;
    if (now - lastIssued < LOGIN_LINK_THROTTLE_MS) return NextResponse.json(SENT);

    const { token, hash } = newLoginToken();
    await payload.update({
      collection: 'member-accounts' as any,
      id: account.id,
      data: {
        loginTokenHash: hash,
        loginTokenExpiresAt: new Date(now + LOGIN_LINK_TTL_MS).toISOString(),
        loginTokenIssuedAt: new Date(now).toISOString(),
      } as any,
      overrideAccess: true,
    });

    const hello = firstName(typeof account.musician === 'object' ? account.musician.name : '');
    await sendMail({
      to: account.email,
      subject: 'Votre lien de connexion — La Chambre Symphonique',
      text: [
        `Bonjour${hello ? ` ${hello}` : ''},`,
        '',
        'Voici votre lien de connexion à l’espace membres, valable 30 minutes et utilisable une seule fois :',
        loginLink(req.nextUrl.origin, token),
        '',
        'Si vous n’avez rien demandé, ignorez ce message : personne ne peut se connecter sans ce lien.',
        '',
        '— La Chambre Symphonique',
      ].join('\n'),
    });
  } catch (err) {
    // Journalisé côté serveur ; l'internaute reçoit la même réponse.
    console.error('Lien espace membres :', err);
  }

  return NextResponse.json(SENT);
}
