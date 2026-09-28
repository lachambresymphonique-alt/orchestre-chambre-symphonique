import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getPayloadClient } from '@/lib/payload';
import { isAdminUser } from '@/lib/access';
import { mailConfigured } from '@/lib/mail';
import { findAccountBy, inviteMember, normalizeEmail } from '@/lib/memberInvitations';

/**
 * Invitation à l'espace membres, depuis la fiche d'un musicien dans l'admin
 * (bouton « Inviter à l'espace membres », src/components/admin/InviteMemberButton.tsx).
 *
 * GET  ?musicianId=… : état de l'accès et adresse suggérée (la plus récente
 *      fiche reçue au même nom, lue par l'API locale : le REST de
 *      musician-submissions est masqué par la route publique du formulaire).
 * POST { musicianId, email } : crée ou met à jour l'accès, émet un lien valable
 *      14 jours, l'envoie par e-mail si le SMTP est configuré et le renvoie
 *      toujours à l'admin, qui peut le transmettre lui-même.
 *
 * Réservé aux administrateurs.
 */

type Payload = Awaited<ReturnType<typeof getPayloadClient>>;

async function requireAdmin(payload: Payload): Promise<boolean> {
  try {
    const { user } = await payload.auth({ headers: await headers() });
    return isAdminUser(user);
  } catch {
    return false;
  }
}

async function findMusician(payload: Payload, id: unknown) {
  if (typeof id !== 'string' && typeof id !== 'number') return null;
  try {
    return (await payload.findByID({ collection: 'musicians' as any, id, depth: 0 })) as any;
  } catch {
    return null;
  }
}

function publicAccount(account: any) {
  if (!account) return null;
  return {
    id: account.id,
    email: account.email,
    status: account.status,
    invitedAt: account.invitedAt ?? null,
    lastLoginAt: account.lastLoginAt ?? null,
  };
}

export async function GET(req: NextRequest) {
  const payload = await getPayloadClient();
  if (!(await requireAdmin(payload))) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }
  const musician = await findMusician(payload, req.nextUrl.searchParams.get('musicianId'));
  if (!musician) return NextResponse.json({ error: 'Fiche introuvable.' }, { status: 404 });

  const account = await findAccountBy(payload, 'musician', musician.id);
  let suggestedEmail: string | null = null;
  if (!account) {
    try {
      const submissions = await payload.find({
        collection: 'musician-submissions' as any,
        where: { name: { equals: musician.name } } as any,
        sort: '-createdAt',
        limit: 1,
        depth: 0,
      });
      suggestedEmail = (submissions.docs[0] as any)?.email ?? null;
    } catch {
      suggestedEmail = null;
    }
  }

  return NextResponse.json({
    account: publicAccount(account),
    suggestedEmail,
    mailConfigured: mailConfigured(),
  });
}

export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  if (!(await requireAdmin(payload))) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }

  let body: { musicianId?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  if (!email) return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  const musician = await findMusician(payload, body.musicianId);
  if (!musician) return NextResponse.json({ error: 'Fiche introuvable.' }, { status: 404 });

  const result = await inviteMember(payload, { musician, email, origin: req.nextUrl.origin });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  const { account, link, emailed, mailError } = result;
  return NextResponse.json({ account: publicAccount(account), link, emailed, mailError });
}
