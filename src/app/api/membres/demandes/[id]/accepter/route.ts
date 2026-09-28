import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { requestIsAdmin } from '@/lib/profileChanges';
import { inviteMember } from '@/lib/memberInvitations';
import { findPupitre } from '@/lib/pupitres';

/**
 * Acceptation d'une demande d'accès : relie la personne à une fiche existante
 * (`musicianId`) ou crée sa fiche (`newFiche`), ajoute son pupitre à la fiche,
 * puis ouvre son accès comme une invitation (lien valable 14 jours, envoyé par
 * e-mail si possible, toujours rendu à l'admin).
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const payload = await getPayloadClient();
  if (!(await requestIsAdmin(payload))) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }
  const { id } = await ctx.params;
  let request: any;
  try {
    request = await payload.findByID({ collection: 'member-requests' as any, id, depth: 0, overrideAccess: true });
  } catch {
    return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 });
  }
  if (request.status !== 'nouvelle') {
    return NextResponse.json({ error: 'Cette demande a déjà été traitée.' }, { status: 409 });
  }

  let body: { musicianId?: unknown; newFiche?: { name?: unknown; role?: unknown } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  const pupitre = findPupitre(request.pupitre);

  let musician: any;
  if (body.musicianId != null && body.musicianId !== '') {
    try {
      musician = await payload.findByID({ collection: 'musicians' as any, id: body.musicianId as any, depth: 0 });
    } catch {
      return NextResponse.json({ error: 'Fiche introuvable.' }, { status: 404 });
    }
    if (pupitre && !(musician.pupitres ?? []).includes(pupitre.value)) {
      musician = await payload.update({
        collection: 'musicians' as any,
        id: musician.id,
        data: { pupitres: [...(musician.pupitres ?? []), pupitre.value] } as any,
      });
    }
  } else {
    const name = typeof body.newFiche?.name === 'string' ? body.newFiche.name.trim() : '';
    const role = typeof body.newFiche?.role === 'string' ? body.newFiche.role.trim() : '';
    if (!name || !role) {
      return NextResponse.json({ error: 'Indiquez le nom et le rôle de la nouvelle fiche.' }, { status: 400 });
    }
    // 'technique' n'est une section valide qu'avec les sections Bureau et Équipe technique en ligne.
    const section: string = request.role === 'technique' ? 'technique' : pupitre?.section ?? 'cordes';
    const last = await payload.find({
      collection: 'musicians' as any,
      where: { section: { equals: section } } as any,
      sort: '-order',
      limit: 1,
      depth: 0,
    });
    const order = last.docs[0] ? Number((last.docs[0] as any).order ?? 0) + 1 : 0;
    try {
      musician = await payload.create({
        collection: 'musicians' as any,
        data: { name, role, section, order, pupitres: pupitre ? [pupitre.value] : [] } as any,
      });
    } catch (err: any) {
      const hint =
        request.role === 'technique'
          ? ' La section « Équipe technique » n’existe peut-être pas encore sur le site : reliez plutôt la demande à une fiche existante.'
          : '';
      return NextResponse.json({ error: `Création de la fiche impossible : ${err?.message || 'erreur'}.${hint}` }, { status: 400 });
    }
  }

  const result = await inviteMember(payload, { musician, email: request.email, origin: req.nextUrl.origin });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  await payload.update({
    collection: 'member-requests' as any,
    id,
    data: { status: 'acceptee', musician: musician.id, decidedAt: new Date().toISOString() } as any,
    overrideAccess: true,
  });

  return NextResponse.json({
    success: true,
    musicianId: musician.id,
    link: result.link,
    emailed: result.emailed,
    mailError: result.mailError,
    email: request.email,
  });
}
