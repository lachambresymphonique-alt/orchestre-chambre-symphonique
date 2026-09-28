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
import { mailConfigured, sendMail, teamNotificationEmail } from '@/lib/mail';
import { normalizeEmail } from '@/lib/memberInvitations';
import { findPupitre, joinRoleLabel } from '@/lib/pupitres';
import { findActiveInviteLink } from '@/lib/inviteLinks';

/**
 * Demande d'accès envoyée depuis un lien d'inscription
 * (/espace-membres/rejoindre/:code). N'ouvre rien : la demande attend la
 * validation de l'équipe (collection member-requests), qui est prévenue par
 * e-mail. Un second envoi avec la même adresse met à jour la demande en attente.
 */

const MAX_NAME = 80;
const MAX_MESSAGE = 1_000;

function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
}

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail('Requête invalide.');
  }
  const sent = NextResponse.json({ success: true });
  if (isHoneypotFilled(body.website)) return sent;

  const tokenStatus = checkFormToken(body.formToken, getFormSecret());
  if (tokenStatus !== 'ok') return fail(FORM_TOKEN_ERRORS[tokenStatus]);
  if (turnstileConfigured()) {
    const check = await verifyTurnstile(body.turnstileToken, process.env.TURNSTILE_SECRET_KEY!, clientIp(req));
    if (!check.success) return fail('La vérification anti-robot a échoué. Merci de réessayer.');
  }

  const payload = await getPayloadClient();
  const link = await findActiveInviteLink(payload, body.code);
  if (!link) return fail('Ce lien d’inscription n’est plus valable. Demandez-en un nouveau à l’équipe.', 410);

  const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const firstName = text(body.firstName, MAX_NAME);
  const lastName = text(body.lastName, MAX_NAME);
  const email = normalizeEmail(body.email);
  const message = text(body.message, MAX_MESSAGE);
  if (!firstName || !lastName) return fail('Indiquez votre prénom et votre nom.');
  if (!email) return fail('Adresse e-mail invalide.');
  let pupitre: string | null = null;
  if (link.role === 'musicien') {
    pupitre = findPupitre(typeof body.pupitre === 'string' ? body.pupitre : '')?.value ?? null;
    if (!pupitre) return fail('Choisissez votre pupitre.');
  }

  const data = {
    title: `${firstName} ${lastName}`,
    firstName,
    lastName,
    email,
    role: link.role,
    pupitre,
    message: message || null,
    link: link.id,
    status: 'nouvelle',
  };
  const pending = await payload.find({
    collection: 'member-requests' as any,
    where: { email: { equals: email }, status: { equals: 'nouvelle' } } as any,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const saved = pending.docs[0]
    ? await payload.update({ collection: 'member-requests' as any, id: (pending.docs[0] as any).id, data: data as any, overrideAccess: true })
    : await payload.create({ collection: 'member-requests' as any, data: data as any, overrideAccess: true });

  if (mailConfigured()) {
    const detail = [joinRoleLabel(link.role), findPupitre(pupitre)?.label].filter(Boolean).join(' · ');
    try {
      await sendMail({
        to: teamNotificationEmail(),
        subject: `[Espace membres] Demande d’accès — ${data.title}`,
        text: [
          `${data.title} (${email}) demande un accès à l’espace membres : ${detail}.`,
          ...(message ? ['', message] : []),
          '',
          `À valider : ${req.nextUrl.origin}/admin/collections/member-requests/${(saved as any).id}`,
        ].join('\n'),
      });
    } catch (err) {
      console.error('Alerte demande d’accès :', err);
    }
  }

  return sent;
}
