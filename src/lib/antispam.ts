/**
 * Protection anti-robots du formulaire de contact — côté serveur uniquement.
 *
 * Trois couches, de la plus simple à la plus robuste :
 *  1. Pot de miel : un champ invisible qu'un humain ne remplit jamais.
 *  2. Jeton signé : émis au rendu de la page, il prouve que le formulaire a
 *     été chargé et mesure le temps de remplissage (un robot poste en < 1 s).
 *  3. Cloudflare Turnstile : captcha invisible, vérifié auprès de Cloudflare.
 *     Actif seulement si les deux clés sont configurées — sans elles, le
 *     formulaire de contact pose à la place une petite question (« Combien
 *     font quatre plus trois ? ») dont la réponse est signée dans un jeton.
 *
 * Aucune donnée n'est ajoutée en base : tout se joue avant l'enregistrement.
 */

import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

/** Un humain ne remplit pas quatre champs en moins de 3 secondes. */
export const MIN_FILL_MS = 3_000;
/** Au-delà, le jeton est périmé (page laissée ouverte trop longtemps). */
export const MAX_TOKEN_AGE_MS = 24 * 60 * 60 * 1_000;

export const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Même secret (et même repli) que `payload.config.ts`. */
export function getFormSecret(env: NodeJS.ProcessEnv = process.env): string {
  return env.PAYLOAD_SECRET || 'dev-secret-change-in-production';
}

function sign(timestamp: string, secret: string): string {
  return createHmac('sha256', secret).update(timestamp).digest('hex');
}

/** Jeton « <timestamp>.<signature> » à rendre dans la page avec le formulaire. */
export function issueFormToken(secret: string, now: number = Date.now()): string {
  const timestamp = String(now);
  return `${timestamp}.${sign(timestamp, secret)}`;
}

export type FormTokenStatus = 'ok' | 'missing' | 'invalid' | 'too-fast' | 'expired';

/** Message affiché à l'internaute pour chaque refus du jeton (partagé par les formulaires). */
export const FORM_TOKEN_ERRORS: Record<Exclude<FormTokenStatus, 'ok'>, string> = {
  'too-fast': 'Envoi trop rapide. Prenez un instant, puis réessayez.',
  expired: 'Le formulaire a expiré. Merci de recharger la page.',
  missing: 'Le formulaire a expiré. Merci de recharger la page.',
  invalid: 'Le formulaire a expiré. Merci de recharger la page.',
};

export function checkFormToken(
  token: unknown,
  secret: string,
  now: number = Date.now(),
): FormTokenStatus {
  if (typeof token !== 'string' || token.length === 0) return 'missing';

  const dot = token.indexOf('.');
  if (dot <= 0) return 'invalid';
  const timestamp = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!/^\d{1,16}$/.test(timestamp)) return 'invalid';

  const expected = Buffer.from(sign(timestamp, secret), 'utf8');
  const given = Buffer.from(signature, 'utf8');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return 'invalid';

  const age = now - Number(timestamp);
  if (age < MIN_FILL_MS) return 'too-fast';
  if (age > MAX_TOKEN_AGE_MS) return 'expired';
  return 'ok';
}

/** Le pot de miel est « rempli » dès qu'il contient autre chose que du vide. */
export function isHoneypotFilled(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Question anti-robot, posée quand Turnstile n'est pas configuré.
 *
 * Les nombres sont écrits en lettres pour qu'un robot ne reconnaisse pas une
 * addition ; la réponse s'écrit en chiffres ou en lettres. Le jeton signe
 * l'heure et la réponse attendue : rien n'est retenu côté serveur.
 */
export type CaptchaChallenge = { question: string; token: string };

const NUMBER_WORDS = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit',
];

function captchaSignature(timestamp: string, answer: number, secret: string): string {
  return sign(`captcha:${timestamp}:${answer}`, secret);
}

export function issueCaptcha(secret: string, now: number = Date.now()): CaptchaChallenge {
  const a = randomInt(1, 10);
  const b = randomInt(1, 10);
  const timestamp = String(now);
  return {
    question: `Combien font ${NUMBER_WORDS[a]} plus ${NUMBER_WORDS[b]} ?`,
    token: `${timestamp}.${captchaSignature(timestamp, a + b, secret)}`,
  };
}

/** « 7 », « sept », « Sept. » → 7 ; tout le reste → null. */
function parseCaptchaAnswer(answer: unknown): number | null {
  if (typeof answer !== 'string') return null;
  const cleaned = answer.trim().toLowerCase().replace(/[\s.]+$/, '').replace(/\s+/g, '-');
  if (/^\d{1,2}$/.test(cleaned)) return Number(cleaned);
  const index = NUMBER_WORDS.indexOf(cleaned);
  return index >= 0 ? index : null;
}

export function checkCaptcha(
  token: unknown,
  answer: unknown,
  secret: string,
  now: number = Date.now(),
): boolean {
  if (typeof token !== 'string') return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const timestamp = token.slice(0, dot);
  if (!/^\d{1,16}$/.test(timestamp) || now - Number(timestamp) > MAX_TOKEN_AGE_MS) return false;

  const value = parseCaptchaAnswer(answer);
  if (value === null) return false;
  const expected = Buffer.from(captchaSignature(timestamp, value, secret), 'utf8');
  const given = Buffer.from(token.slice(dot + 1), 'utf8');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Turnstile n'est appliqué que si la clé publique ET la clé secrète existent. */
export function turnstileConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.TURNSTILE_SECRET_KEY && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export type TurnstileVerification = { success: boolean; errorCodes: string[] };

/** Vérifie un jeton Turnstile auprès de Cloudflare. Ne lève jamais : un échec réseau = refus. */
export async function verifyTurnstile(
  token: unknown,
  secret: string,
  remoteIp?: string | null,
  fetchImpl: typeof fetch = fetch,
): Promise<TurnstileVerification> {
  if (typeof token !== 'string' || token.length === 0) {
    return { success: false, errorCodes: ['missing-input-response'] };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const res = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5_000),
    });
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    return { success: data.success === true, errorCodes: data['error-codes'] ?? [] };
  } catch {
    return { success: false, errorCodes: ['network-error'] };
  }
}
