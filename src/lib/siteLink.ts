/**
 * Routes du site appelées par Orchestra Manager (/api/site-link/*) : même clé
 * que dans l'autre sens, ORCHESTRA_MANAGER_SITE_KEY ici, SITE_LINK_KEY là-bas
 * (en-tête « Authorization: Bearer … »). Côté serveur uniquement.
 */
import { timingSafeEqual } from 'node:crypto';

export type SiteLinkCheck = 'ok' | 'not-configured' | 'refused';

export function checkSiteLinkKey(
  authorization: string | null | undefined,
  configured: string | undefined = process.env.ORCHESTRA_MANAGER_SITE_KEY,
): SiteLinkCheck {
  const expected = (configured ?? '').trim();
  if (expected.length < 32) return 'not-configured';
  const given = (authorization ?? '').replace(/^Bearer\s+/i, '').trim();
  const a = Buffer.from(given, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return 'refused';
  return timingSafeEqual(a, b) ? 'ok' : 'refused';
}

/** Réponse d'erreur quand la clé manque ou ne correspond pas, sinon null. */
export function siteLinkRefusal(authorization: string | null): { status: number; error: string } | null {
  const check = checkSiteLinkKey(authorization);
  if (check === 'ok') return null;
  return check === 'not-configured'
    ? { status: 503, error: 'Liaison avec Orchestra Manager non configurée sur le site.' }
    : { status: 401, error: 'Clé refusée.' };
}
