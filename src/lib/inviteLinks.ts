/** Liens d'inscription à l'espace membres (collection member-invite-links). Côté serveur. */
import { getPayloadClient } from './payload';

type Payload = Awaited<ReturnType<typeof getPayloadClient>>;

/** Lien d'inscription utilisable (actif, non expiré) pour ce code, sinon null. */
export async function findActiveInviteLink(
  payload: Payload,
  code: unknown,
): Promise<{ id: number | string; role: 'musicien' | 'technique'; label: string } | null> {
  if (typeof code !== 'string' || !/^[\w-]{8,64}$/.test(code)) return null;
  const result = await payload.find({
    collection: 'member-invite-links' as any,
    where: { code: { equals: code }, active: { equals: true } } as any,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const link = result.docs[0] as any;
  if (!link) return null;
  if (link.expiresAt) {
    const end = new Date(link.expiresAt);
    end.setHours(23, 59, 59, 999);
    if (end.getTime() < Date.now()) return null;
  }
  return { id: link.id, role: link.role, label: link.label };
}
