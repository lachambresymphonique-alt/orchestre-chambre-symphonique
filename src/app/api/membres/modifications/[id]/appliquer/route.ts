import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { PROFILE_FIELDS, comparable, toMusicianValue } from '@/lib/profileFields';
import { findProposal, notifyMember, requestIsAdmin } from '@/lib/profileChanges';

/**
 * « Appliquer à la fiche » : recopie dans la fiche musicien les seuls champs
 * cochés de la proposition (valeurs éventuellement corrigées par l'admin),
 * puis prévient le membre.
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

  const changed: string[] = proposal.changedFields ?? [];
  const data: Record<string, unknown> = {};
  for (const field of PROFILE_FIELDS.filter((f) => changed.includes(f.name))) {
    const value = comparable(field.name, proposal[field.name]);
    // Une fiche garde toujours un nom, et une photo ne s'efface pas par ce biais.
    if (!value && (field.name === 'name' || field.name === 'photo')) continue;
    data[field.name] = toMusicianValue(field.name, value);
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à appliquer : cochez au moins un champ modifié.' }, { status: 400 });
  }

  let musician: any;
  try {
    musician = await payload.update({ collection: 'musicians' as any, id: proposal.musician, data: data as any });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Mise à jour de la fiche impossible.' }, { status: 500 });
  }

  await payload.update({
    collection: 'profile-changes' as any,
    id,
    data: { status: 'appliquee', decidedAt: new Date().toISOString() } as any,
    overrideAccess: true,
  });

  const note = typeof proposal.reviewNote === 'string' ? proposal.reviewNote.trim() : '';
  await notifyMember(payload, proposal, 'Votre fiche est à jour — La Chambre Symphonique', [
    'Bonjour,',
    '',
    'L’équipe a relu et publié les modifications de votre fiche.',
    ...(note ? ['', note] : []),
    '',
    `Votre fiche : ${req.nextUrl.origin}/musiciens/${musician.slug}`,
  ]);

  return NextResponse.json({ success: true, musicianId: musician.id });
}
