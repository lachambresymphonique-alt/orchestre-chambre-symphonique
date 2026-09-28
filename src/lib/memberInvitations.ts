/**
 * Ouverture d'un accès à l'espace membres pour une fiche : crée ou met à jour
 * le compte, émet un lien de connexion valable 14 jours, l'envoie par e-mail
 * si le SMTP est configuré et le rend toujours à l'admin, qui peut aussi le
 * partager dans une discussion. Utilisé par le bouton « Inviter » d'une fiche
 * (/api/membres/invitation) et par la validation d'une demande d'accès
 * (/api/membres/demandes/:id/accepter).
 */
import { getPayloadClient } from './payload';
import { mailConfigured, sendMail } from './mail';
import { INVITATION_TTL_MS, firstName, loginLink, newLoginToken } from './memberSession';

type Payload = Awaited<ReturnType<typeof getPayloadClient>>;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: unknown): string {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return EMAIL_RE.test(email) && email.length <= 254 ? email : '';
}

export async function findAccountBy(payload: Payload, field: 'musician' | 'email', value: unknown) {
  const result = await payload.find({
    collection: 'member-accounts' as any,
    where: { [field]: { equals: value } } as any,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return (result.docs[0] as any) ?? null;
}

export type InvitationResult =
  | { ok: true; account: any; link: string; emailed: boolean; mailError: string | null }
  | { ok: false; status: number; error: string };

export async function inviteMember(
  payload: Payload,
  { musician, email, origin }: { musician: { id: number | string; name?: string | null }; email: string; origin: string },
): Promise<InvitationResult> {
  const existing = await findAccountBy(payload, 'musician', musician.id);
  const sameEmail = await findAccountBy(payload, 'email', email);
  if (sameEmail && sameEmail.id !== existing?.id) {
    let otherName = '';
    try {
      const other = (await payload.findByID({ collection: 'musicians' as any, id: sameEmail.musician, depth: 0 })) as any;
      otherName = other?.name || '';
    } catch {
      otherName = '';
    }
    return {
      ok: false,
      status: 409,
      error: `Cette adresse donne déjà accès à la fiche de ${otherName || 'quelqu’un d’autre'}.`,
    };
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
    return { ok: false, status: 500, error: err?.message || 'Enregistrement impossible.' };
  }

  const link = loginLink(origin, token);
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
          'Vous êtes invité·e à rejoindre l’espace membres du site de La Chambre Symphonique, où vous retrouverez votre fiche et vos partitions.',
          '',
          'Pour vous connecter, ouvrez ce lien (valable 14 jours) :',
          link,
          '',
          `Ensuite, il suffira de saisir votre adresse e-mail sur ${origin}/espace-membres pour recevoir un nouveau lien : aucun mot de passe à retenir.`,
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

  return { ok: true, account, link, emailed, mailError };
}
