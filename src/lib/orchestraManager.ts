/**
 * Liaison avec Orchestra Manager (application Apollo de l'orchestre), où se
 * trouve l'espace des musiciens : sessions, covoiturage, remboursements…
 *
 * Quand l'équipe accepte un musicien ici, le site demande à Orchestra Manager
 * une invitation « Adhérent » (route /api/site-link/musician-access, protégée
 * par une clé partagée), puis envoie lui-même le lien au musicien avec son SMTP.
 * Orchestra Manager retrouve la fiche par e-mail ou la crée ; c'est le musicien
 * qui choisit ensuite son identifiant et son mot de passe.
 *
 * Variables Vercel : ORCHESTRA_MANAGER_API_URL (adresse du serveur, sans /api)
 * et ORCHESTRA_MANAGER_SITE_KEY (même valeur que SITE_LINK_KEY côté Orchestra
 * Manager). Sans elles, rien n'est tenté et le bouton n'apparaît pas.
 * Côté serveur uniquement.
 */
import { mailConfigured, sendMail } from './mail';

export type OMAccess =
  | { status: 'account' }
  | { status: 'invited'; expiresAt: string; link: string }
  | { status: 'none' };

export type OMMusician = { firstName: string; lastName: string; email: string; phone?: string | null };

export type OMInvitationResult = OMAccess & { emailed: boolean; mailError: string | null };

const TIMEOUT_MS = 8_000;

export function omConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.ORCHESTRA_MANAGER_API_URL?.trim() && (env.ORCHESTRA_MANAGER_SITE_KEY?.trim().length ?? 0) >= 32);
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!omConfigured()) throw new Error('Liaison avec Orchestra Manager non configurée.');
  const base = (process.env.ORCHESTRA_MANAGER_API_URL as string).trim().replace(/\/+$/, '');
  let res: Response;
  try {
    res = await fetch(`${base}/api${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${(process.env.ORCHESTRA_MANAGER_SITE_KEY as string).trim()}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch {
    throw new Error('Orchestra Manager ne répond pas. Réessayez dans un instant.');
  }
  const json = (await res.json().catch(() => ({}))) as { data?: T; error?: string };
  if (!res.ok || !json.data) {
    if (res.status === 401) throw new Error('Orchestra Manager refuse la clé du site (ORCHESTRA_MANAGER_SITE_KEY ≠ SITE_LINK_KEY).');
    if (res.status === 503) throw new Error('La liaison n’est pas activée côté Orchestra Manager (SITE_LINK_KEY absente).');
    if (res.status === 404) throw new Error('Orchestra Manager ne connaît pas encore cette liaison : sa mise à jour n’est peut-être pas en ligne.');
    throw new Error(json.error || `Orchestra Manager : erreur ${res.status}.`);
  }
  return json.data;
}

/** Où en est l'accès de cette adresse dans Orchestra Manager. */
export function omAccessStatus(email: string): Promise<OMAccess> {
  return call<OMAccess>(`/site-link/musician-access?email=${encodeURIComponent(email)}`);
}

/** « Jean-Pierre de la Tour » → Jean-Pierre / de la Tour. */
export function splitName(full: string | null | undefined): { firstName: string; lastName: string } {
  const parts = (full ?? '').trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });

export function invitationEmailText(firstName: string, link: string, expiresAt: string): string {
  return [
    `Bonjour${firstName ? ` ${firstName}` : ''},`,
    '',
    'Bienvenue dans La Chambre Symphonique ! Votre espace musicien se trouve sur Apollo, l’application de l’orchestre : sessions et répétitions, covoiturage, remboursements, partitions.',
    '',
    `Pour créer votre accès (identifiant et mot de passe), ouvrez ce lien, valable jusqu’au ${formatDate(expiresAt)} :`,
    link,
    '',
    'Si vous n’attendiez pas ce message, ignorez-le simplement.',
    '',
    '— La Chambre Symphonique',
  ].join('\n');
}

/**
 * Invitation complète : demandée à Orchestra Manager, puis envoyée au musicien.
 * Un musicien qui a déjà son compte ne reçoit rien (« account »).
 */
export async function inviteToOrchestraManager(musician: OMMusician): Promise<OMInvitationResult> {
  const access = await call<OMAccess>('/site-link/musician-access', {
    method: 'POST',
    body: JSON.stringify({
      firstName: musician.firstName,
      lastName: musician.lastName,
      email: musician.email,
      phone: musician.phone ?? null,
    }),
  });
  if (access.status !== 'invited') return { ...access, emailed: false, mailError: null };
  if (!mailConfigured()) return { ...access, emailed: false, mailError: 'L’envoi d’e-mails n’est pas configuré sur le site.' };
  try {
    await sendMail({
      to: musician.email,
      subject: 'Votre espace musicien — La Chambre Symphonique',
      text: invitationEmailText(musician.firstName, access.link, access.expiresAt),
    });
    return { ...access, emailed: true, mailError: null };
  } catch (err) {
    console.error('Invitation Orchestra Manager : e-mail non envoyé', err);
    return { ...access, emailed: false, mailError: (err as Error)?.message || 'Envoi impossible.' };
  }
}
