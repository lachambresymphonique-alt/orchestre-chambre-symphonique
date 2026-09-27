import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { comparable } from '@/lib/profileFields';
import { findProposal, notifyMember, requestIsAdmin } from '@/lib/profileChanges';

/**
 * « Refuser » : la fiche ne change pas ; le motif est enregistré et montré au
 * membre dans son espace. Une photo envoyée avec la proposition est supprimée.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const payload = await getPayloadClient();
  if (!(await requestIsAdmin(payload))) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const proposal = await findProposal(payload, id);
  if (!proposal) return NextResponse.json({ error: 'Proposition introuvable.' }, { status: 404 });
  if (proposal.status !== 'en-attente') {
    return NextResponse.json({ error: 'Cette proposition a déjà été traitée.' }, { status: 409 });
  }

  let note = '';
  try {
    const body = await req.json();
    note = typeof body?.note === 'string' ? body.note.trim().slice(0, 2_000) : '';
  } catch {
    note = '';
  }

  const photoId = proposal.changedFields?.includes('photo') ? comparable('photo', proposal.photo) : '';
  await payload.update({
    collection: 'profile-changes' as any,
    id,
    data: { status: 'refusee', decidedAt: new Date().toISOString(), reviewNote: note || null, photo: null } as any,
    overrideAccess: true,
  });

  if (photoId) {
    try {
      const musician = (await payload.findByID({ collection: 'musicians' as any, id: proposal.musician, depth: 0 })) as any;
      if (comparable('photo', musician?.photo) !== photoId) {
        await payload.delete({ collection: 'media' as any, id: photoId, overrideAccess: true });
      }
    } catch {
      // Photo déjà supprimée : rien à faire.
    }
  }

  await notifyMember(payload, proposal, 'Votre modification de fiche — La Chambre Symphonique', [
    'Bonjour,',
    '',
    'L’équipe a relu votre proposition de modification et ne l’a pas publiée en l’état.',
    ...(note ? ['', note] : []),
    '',
    `Vous pouvez la reprendre depuis votre espace : ${req.nextUrl.origin}/espace-membres/fiche`,
  ]);

  return NextResponse.json({ success: true });
}
