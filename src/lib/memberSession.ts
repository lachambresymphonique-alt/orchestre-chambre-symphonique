/**
 * Connexion à l'espace membres : lien à usage unique envoyé par e-mail, puis
 * cookie de session signé. Côté serveur uniquement.
 *
 * - Le lien porte un jeton aléatoire ; la base n'en garde que l'empreinte
 *   SHA-256 et la date d'expiration (collection member-accounts). Il est
 *   effacé dès qu'il a servi.
 * - Le cookie contient « id.version.expiration.signature » (HMAC dérivé de
 *   PAYLOAD_SECRET). Désactiver un compte incrémente sa version : les cookies
 *   déjà émis ne valent plus rien.
 *
 * Ce n'est pas une session Payload : `req.user` reste vide pour un membre, qui
 * n'a donc aucun droit dans l'admin ni dans l'API (voir src/lib/access.ts).
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { getFormSecret } from './antispam';
import { getPayloadClient } from './payload';

export const MEMBER_COOKIE = 'lcs_membre';
export const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;
/** Lien d'invitation envoyé par l'équipe : le temps de lire ses e-mails. */
export const INVITATION_TTL_MS = 14 * 24 * 60 * 60 * 1_000;
/** Lien demandé par le membre lui-même sur /espace-membres. */
export const LOGIN_LINK_TTL_MS = 30 * 60 * 1_000;
/** Un seul lien par minute et par compte : protège la boîte du membre. */
export const LOGIN_LINK_THROTTLE_MS = 60 * 1_000;

export type MemberAccount = {
  id: number | string;
  email: string;
  status: 'invite' | 'actif' | 'desactive';
  sessionVersion?: number | null;
  musician: MemberMusician | number | string | null;
};

export type MemberMusician = {
  id: number | string;
  name: string;
  slug?: string | null;
  role?: string | null;
  instrument?: string | null;
  section?: string | null;
  photo?: { url?: string | null; alt?: string | null } | number | null;
};

export type MemberSession = { account: MemberAccount; musician: MemberMusician };

export function hashLoginToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Nouveau jeton de connexion : à envoyer tel quel, à stocker haché. */
export function newLoginToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashLoginToken(token) };
}

export function loginLink(origin: string, token: string): string {
  return `${origin.replace(/\/$/, '')}/espace-membres/connexion?jeton=${encodeURIComponent(token)}`;
}

/** Clé distincte de celle des jetons de formulaire, dérivée du même secret. */
function sessionKey(): Buffer {
  return createHmac('sha256', getFormSecret()).update('lcs-member-session').digest();
}

function sign(payload: string): string {
  return createHmac('sha256', sessionKey()).update(payload).digest('base64url');
}

export function encodeSession(id: number | string, version: number, now: number = Date.now()): string {
  const payload = `${id}.${version}.${now + SESSION_MAX_AGE_S * 1_000}`;
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(
  raw: string | undefined,
  now: number = Date.now(),
): { id: string; version: number } | null {
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length !== 4) return null;
  const [id, version, expires, signature] = parts;
  if (!/^\w{1,64}$/.test(id) || !/^\d{1,9}$/.test(version) || !/^\d{1,16}$/.test(expires)) return null;
  const expected = Buffer.from(sign(`${id}.${version}.${expires}`));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  if (Number(expires) < now) return null;
  return { id, version: Number(version) };
}

/** Options du cookie de session (httpOnly : jamais lisible par le JavaScript de la page). */
export function sessionCookie(value: string) {
  return {
    name: MEMBER_COOKIE,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_S,
  };
}

/** Membre connecté pour la requête en cours, ou null. */
export const getMemberSession = cache(async (): Promise<MemberSession | null> => {
  const session = decodeSession((await cookies()).get(MEMBER_COOKIE)?.value);
  if (!session) return null;
  try {
    const payload = await getPayloadClient();
    const account = (await payload.findByID({
      collection: 'member-accounts' as any,
      id: session.id,
      depth: 2,
      overrideAccess: true,
    })) as unknown as MemberAccount | null;
    if (!account || account.status !== 'actif') return null;
    if ((Number(account.sessionVersion) || 0) !== session.version) return null;
    if (!account.musician || typeof account.musician !== 'object') return null;
    return { account, musician: account.musician };
  } catch {
    return null;
  }
});

/** Prénom pour les formules d'accueil : le premier mot du nom complet. */
export function firstName(name: string | null | undefined): string {
  return (name || '').trim().split(/\s+/)[0] || '';
}
