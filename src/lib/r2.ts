/**
 * Stockage privé des documents de l'espace membres : Cloudflare R2, par son
 * API compatible S3. Côté serveur uniquement.
 *
 * Aucun fichier ne transite par le site : l'admin envoie directement au
 * stockage avec un lien d'envoi signé (Vercel refuse les requêtes de plus de
 * 4,5 Mo, une partition scannée les dépasse vite), et un membre télécharge
 * avec un lien signé valable quelques minutes, délivré seulement après
 * vérification de ses droits. Le stockage n'a aucun accès public.
 *
 * Signature « AWS Signature Version 4 » par paramètres d'adresse, écrite ici
 * pour éviter une dépendance ; contrôlée sur l'exemple officiel d'AWS
 * (voir presignUrl).
 *
 * Variables (Vercel et .env.local) : R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
 * R2_SECRET_ACCESS_KEY, R2_BUCKET. R2_ENDPOINT et R2_REGION ne servent
 * qu'à tester avec un autre stockage compatible S3.
 */
import { createHash, createHmac, randomUUID } from 'node:crypto';

export type R2Config = {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

export function r2Config(env: NodeJS.ProcessEnv = process.env): R2Config | null {
  const endpoint =
    env.R2_ENDPOINT || (env.R2_ACCOUNT_ID ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '');
  if (!endpoint || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) return null;
  return {
    endpoint: endpoint.replace(/\/+$/, ''),
    bucket: env.R2_BUCKET,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    region: env.R2_REGION || 'auto',
  };
}

/** Encodage RFC 3986 exigé par la signature (encodeURIComponent laisse passer !'()*). */
function encode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

const sha256 = (data: string) => createHash('sha256').update(data).digest('hex');
const hmac = (key: Buffer | string, data: string) => createHmac('sha256', key).update(data).digest();

/**
 * Paramètres signés d'une adresse pré-signée (sans « ? »). `path` est le
 * chemin canonique, déjà encodé segment par segment.
 *
 * Contrôle : l'exemple de la documentation AWS (GET examplebucket/test.txt,
 * 24 mai 2013, 86 400 s) doit donner la signature aeeed9bb…f604d404.
 */
export function presignQuery(opts: {
  method: string;
  host: string;
  path: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  expiresIn: number;
  query?: Record<string, string>;
  now?: Date;
}): string {
  const amzDate = (opts.now ?? new Date()).toISOString().replace(/[:-]|\.\d{3}/g, '');
  const day = amzDate.slice(0, 8);
  const scope = `${day}/${opts.region}/s3/aws4_request`;
  const params: Record<string, string> = {
    ...opts.query,
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${opts.accessKeyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(opts.expiresIn),
    'X-Amz-SignedHeaders': 'host',
  };
  const canonicalQuery = Object.keys(params)
    .map((k) => [encode(k), encode(params[k])])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const canonicalRequest = [opts.method, opts.path, canonicalQuery, `host:${opts.host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonicalRequest)].join('\n');
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${opts.secretAccessKey}`, day), opts.region), 's3'), 'aws4_request');
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  return `${canonicalQuery}&X-Amz-Signature=${signature}`;
}

/** Adresse pré-signée d'un objet du stockage (accès « chemin » : endpoint/bucket/clé). */
export function presignUrl(
  config: R2Config,
  method: 'GET' | 'PUT' | 'DELETE' | 'HEAD',
  key: string,
  expiresIn: number,
  query?: Record<string, string>,
): string {
  const base = new URL(config.endpoint);
  const path = `${base.pathname.replace(/\/+$/, '')}/${encode(config.bucket)}/${key.split('/').map(encode).join('/')}`;
  const signed = presignQuery({
    method,
    host: base.host,
    path,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region,
    expiresIn,
    query,
  });
  return `${base.protocol}//${base.host}${path}?${signed}`;
}

/** Nom de fichier réduit à des caractères sûrs, pour la clé de stockage. */
function safeName(fileName: string): string {
  const cleaned = fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-120);
  return cleaned || 'document';
}

/** Clé d'un nouveau document : imprévisible, rangée par année. */
export function newObjectKey(fileName: string, now: Date = new Date()): string {
  return `documents/${now.getFullYear()}/${randomUUID()}-${safeName(fileName)}`;
}

/** Lien de téléchargement : ouvert dans le navigateur (PDF, images) sous son vrai nom. */
export function downloadUrl(config: R2Config, key: string, fileName: string, expiresIn = 300): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return presignUrl(config, 'GET', key, expiresIn, {
    'response-content-disposition': `inline; filename="${ascii}"; filename*=UTF-8''${encode(fileName)}`,
  });
}

/** Supprime un objet ; un objet déjà absent n'est pas une erreur. */
export async function deleteObject(config: R2Config, key: string): Promise<void> {
  const res = await fetch(presignUrl(config, 'DELETE', key, 60), { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error(`Suppression du fichier impossible (${res.status})`);
}
