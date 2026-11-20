/**
 * Coordonnées d'un musicien pour l'inviter : la fiche publique (collection
 * Musiciens) n'a volontairement ni e-mail ni téléphone, puisque /musiciens
 * envoie les fiches entières au navigateur. On les reprend de la dernière
 * fiche reçue au même nom (formulaire de recrutement), sinon de son accès à
 * l'espace membres. Côté serveur uniquement.
 */
import type { getPayloadClient } from './payload';
import { splitName } from './orchestraManager';

type Payload = Awaited<ReturnType<typeof getPayloadClient>>;

export type MusicianContact = { email: string | null; firstName: string; lastName: string; phone: string | null };

export async function musicianContact(
  payload: Payload,
  musician: { id: number | string; name?: string | null },
): Promise<MusicianContact> {
  const fallback = splitName(musician.name);
  try {
    const submissions = await payload.find({
      collection: 'musician-submissions' as any,
      where: { name: { equals: musician.name } } as any,
      sort: '-createdAt',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const s = submissions.docs[0] as any;
    if (s?.email) {
      return {
        email: String(s.email).trim().toLowerCase(),
        firstName: s.firstName || fallback.firstName,
        lastName: s.lastName || fallback.lastName,
        phone: s.phone || null,
      };
    }
  } catch {
    // Lecture impossible : on tente l'accès membres.
  }
  try {
    const accounts = await payload.find({
      collection: 'member-accounts' as any,
      where: { musician: { equals: musician.id } } as any,
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const email = (accounts.docs[0] as any)?.email;
    if (email) return { email, ...fallback, phone: null };
  } catch {
    // Pas d'accès membres.
  }
  return { email: null, ...fallback, phone: null };
}
