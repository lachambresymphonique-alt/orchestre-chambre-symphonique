import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { requestIsAdmin } from '@/lib/profileChanges';
import { findPupitre, joinRoleLabel } from '@/lib/pupitres';

/**
 * Détail d'une demande d'accès pour l'écran de validation
 * (MemberRequestReview) : fiches existantes au nom proche, pour relier la
 * demande plutôt que créer un doublon, et suggestions pour une nouvelle fiche.
 */

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
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

  const full = normalize(`${request.firstName} ${request.lastName}`);
  const last = normalize(request.lastName || '');
  const musicians = await payload.find({ collection: 'musicians' as any, limit: 1000, depth: 0, pagination: false });
  const accounts = await payload.find({
    collection: 'member-accounts' as any,
    limit: 1000,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const withAccount = new Map((accounts.docs as any[]).map((a) => [String(a.musician), a.email]));

  const candidates = (musicians.docs as any[])
    .map((m) => {
      const name = normalize(m.name || '');
      const score = name === full ? 2 : last && name.split(' ').includes(last) ? 1 : 0;
      return { m, score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || String(a.m.name).localeCompare(String(b.m.name)))
    .slice(0, 8)
    .map(({ m, score }) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      section: m.section,
      exact: score === 2,
      accountEmail: withAccount.get(String(m.id)) ?? null,
    }));

  const pupitre = findPupitre(request.pupitre);
  return NextResponse.json({
    status: request.status,
    decidedAt: request.decidedAt ?? null,
    name: `${request.firstName} ${request.lastName}`,
    email: request.email,
    roleLabel: joinRoleLabel(request.role),
    pupitreLabel: pupitre?.label ?? '',
    candidates,
    suggestion: {
      name: `${request.firstName} ${request.lastName}`,
      role: request.role === 'technique' ? 'Équipe technique' : pupitre?.role ?? '',
    },
  });
}
