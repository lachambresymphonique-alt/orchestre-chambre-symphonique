import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { PROFILE_FIELDS, comparable } from '@/lib/profileFields';
import { findProposal, requestIsAdmin } from '@/lib/profileChanges';

/**
 * Comparaison « en ligne / proposé » d'une modification de fiche, pour
 * l'écran de validation de l'admin (ProfileChangeDiff, ProfileChangeReview).
 * `conflict` : l'équipe a changé ce champ de la fiche depuis l'envoi.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const payload = await getPayloadClient();
  if (!(await requestIsAdmin(payload))) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const proposal = await findProposal(payload, id);
  if (!proposal) return NextResponse.json({ error: 'Proposition introuvable.' }, { status: 404 });

  let musician: any = null;
  try {
    musician = await payload.findByID({ collection: 'musicians' as any, id: proposal.musician, depth: 1 });
  } catch {
    musician = null;
  }

  const photoUrl = async (mediaId: string) => {
    if (!mediaId) return null;
    try {
      const media = (await payload.findByID({ collection: 'media' as any, id: mediaId, depth: 0 })) as any;
      return media?.sizes?.card?.url || media?.url || null;
    } catch {
      return null;
    }
  };

  const changed: string[] = proposal.changedFields ?? [];
  const base: Record<string, string> = proposal.base ?? {};
  const rows = [];
  for (const field of PROFILE_FIELDS.filter((f) => changed.includes(f.name))) {
    const current = comparable(field.name, musician?.[field.name]);
    const proposed = comparable(field.name, proposal[field.name]);
    rows.push({
      name: field.name,
      label: field.label,
      kind: field.kind,
      current,
      proposed,
      currentUrl: field.kind === 'photo' ? await photoUrl(current) : null,
      proposedUrl: field.kind === 'photo' ? await photoUrl(proposed) : null,
      conflict: field.name in base && base[field.name] !== current,
    });
  }

  return NextResponse.json({
    status: proposal.status,
    decidedAt: proposal.decidedAt ?? null,
    reviewNote: proposal.reviewNote ?? '',
    musician: musician ? { id: musician.id, name: musician.name, slug: musician.slug } : null,
    rows,
  });
}
