import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { encodeSession, hashLoginToken, sessionCookie } from '@/lib/memberSession';

/**
 * Ouverture de session à partir d'un lien reçu par e-mail.
 *
 * Le lien mène à /espace-membres/connexion, une page avec un bouton qui
 * poste ici le jeton : les messageries qui ouvrent les liens pour les
 * analyser (Outlook Safe Links…) ne cliquent pas sur un bouton, et ne
 * consomment donc pas ce jeton à usage unique.
 */

function redirectTo(req: NextRequest, path: string) {
  // 303 : le navigateur suit en GET après ce POST.
  return NextResponse.redirect(new URL(path, req.nextUrl.origin), 303);
}

export async function POST(req: NextRequest) {
  let token = '';
  try {
    const form = await req.formData();
    const value = form.get('jeton');
    token = typeof value === 'string' ? value.trim() : '';
  } catch {
    token = '';
  }
  if (!token || token.length > 200) return redirectTo(req, '/espace-membres?lien=invalide');

  const payload = await getPayloadClient();
  const found = await payload.find({
    collection: 'member-accounts' as any,
    where: { loginTokenHash: { equals: hashLoginToken(token) } } as any,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const account = found.docs[0] as any;
  const expires = account?.loginTokenExpiresAt ? Date.parse(account.loginTokenExpiresAt) : 0;
  if (!account || account.status === 'desactive' || !account.musician || expires < Date.now()) {
    return redirectTo(req, '/espace-membres?lien=invalide');
  }

  await payload.update({
    collection: 'member-accounts' as any,
    id: account.id,
    data: {
      status: 'actif',
      lastLoginAt: new Date().toISOString(),
      loginTokenHash: null,
      loginTokenExpiresAt: null,
    } as any,
    overrideAccess: true,
  });

  const res = redirectTo(req, '/espace-membres');
  res.cookies.set(sessionCookie(encodeSession(account.id, Number(account.sessionVersion) || 0)));
  return res;
}
