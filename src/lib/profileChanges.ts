/**
 * Outils communs aux routes de validation des modifications de fiche
 * (/api/membres/modifications/…), réservées aux administrateurs.
 */
import { headers } from 'next/headers';
import { isAdminUser } from './access';
import { getPayloadClient } from './payload';
import { mailConfigured, sendMail } from './mail';

type Payload = Awaited<ReturnType<typeof getPayloadClient>>;

/** Vrai si la requête porte une session d'administrateur. */
export async function requestIsAdmin(payload: Payload): Promise<boolean> {
  try {
    const { user } = await payload.auth({ headers: await headers() });
    return isAdminUser(user);
  } catch {
    return false;
  }
}

export async function findProposal(payload: Payload, id: string): Promise<any | null> {
  try {
    return await payload.findByID({ collection: 'profile-changes' as any, id, depth: 0, overrideAccess: true });
  } catch {
    return null;
  }
}

/** Dernière proposition envoyée pour une fiche (en attente, appliquée ou refusée). */
export async function latestProposal(payload: Payload, musicianId: string | number): Promise<any | null> {
  try {
    const result = await payload.find({
      collection: 'profile-changes' as any,
      where: { musician: { equals: musicianId } } as any,
      sort: '-submittedAt',
      limit: 1,
      depth: 1,
      overrideAccess: true,
    });
    return result.docs[0] ?? null;
  } catch {
    return null;
  }
}

/** Écrit au membre qui a envoyé la proposition, si l'envoi d'e-mails est configuré. */
export async function notifyMember(
  payload: Payload,
  proposal: any,
  subject: string,
  lines: string[],
): Promise<void> {
  if (!mailConfigured() || !proposal?.account) return;
  try {
    const account = (await payload.findByID({
      collection: 'member-accounts' as any,
      id: typeof proposal.account === 'object' ? proposal.account.id : proposal.account,
      depth: 0,
      overrideAccess: true,
    })) as any;
    if (!account?.email || account.status === 'desactive') return;
    await sendMail({ to: account.email, subject, text: [...lines, '', '— La Chambre Symphonique'].join('\n') });
  } catch (err) {
    console.error('E-mail au membre :', err);
  }
}
