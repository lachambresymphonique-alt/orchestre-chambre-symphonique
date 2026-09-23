/**
 * Google Analytics 4 — lecture de la fréquentation via l'API « Analytics Data »
 * (https://developers.google.com/analytics/devguides/reporting/data/v1).
 *
 * Sans dépendance : authentification par compte de service (JWT RS256 signé
 * avec le module `crypto` de Node, échangé contre un jeton OAuth), puis appels
 * REST. Les réponses sont gardées quelques minutes en mémoire par instance
 * serveur : Google consolide de toute façon ses chiffres avec retard, et cela
 * ménage le quota gratuit de l'API.
 *
 * Variables d'environnement (un guide s'affiche dans l'admin tant qu'elles
 * manquent, voir `src/components/admin/AnalyticsView.tsx`) :
 *   GA_SERVICE_ACCOUNT_KEY  contenu complet du fichier JSON de la clé du
 *                           compte de service (ou ce JSON encodé en base64)
 *   — ou, à la place du JSON —
 *   GA_CLIENT_EMAIL         e-mail du compte de service
 *   GA_PRIVATE_KEY          sa clé privée PEM
 *   GA_PROPERTY_ID          (facultatif) identifiant numérique de la propriété
 *                           GA4, si elle change un jour ; sinon la valeur
 *                           DEFAULT_PROPERTY_ID ci-dessous est utilisée
 *
 * La balise elle-même (gtag.js) est posée dans `src/app/(frontend)/layout.tsx`.
 */
import { createSign } from 'crypto';

// ─── Périodes ────────────────────────────────────────────────────────────────

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];

/** `?periode=7|30|90` → période valide (30 jours par défaut). */
export function parsePeriod(raw: unknown): Period {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return (PERIODS as readonly number[]).includes(value) ? (value as Period) : 30;
}

// ─── Configuration ───────────────────────────────────────────────────────────

export type AnalyticsConfig = {
  propertyId: string;
  clientEmail: string;
  privateKey: string;
};

export type ConfigStatus = {
  /** Identifiant de propriété utilisé, ou null s'il est invalide. */
  propertyId: string | null;
  /** Origine de l'identifiant : variable d'environnement ou valeur inscrite dans le code. */
  propertySource: 'env' | 'default' | null;
  credentials: boolean;
  /** Explication quand une variable est présente mais inutilisable. */
  problem?: string;
};

/**
 * Propriété GA4 « La chambre symphonique » (Google Analytics → Administration →
 * Détails de la propriété). L'identifiant n'est pas secret : il ne donne aucun
 * accès sans compte autorisé. GA_PROPERTY_ID permet de le remplacer sans
 * toucher au code.
 */
export const DEFAULT_PROPERTY_ID = '546207548';

const PEM_RE = /-----BEGIN [A-Z ]*PRIVATE KEY-----/;

/**
 * GA_PROPERTY_ID → identifiant numérique, ou l'explication de ce qui ne va pas.
 * Confusions fréquentes : l'ID de mesure « G-… » de la balise, et l'ID de flux
 * (11 chiffres, écran « Détails du flux Web ») alors que l'ID de propriété en a 9.
 */
function readPropertyId(): { id: string; source: 'env' | 'default' } | { problem: string } {
  const raw = (process.env.GA_PROPERTY_ID || '').trim().replace(/^properties\//, '');
  if (!raw) return { id: DEFAULT_PROPERTY_ID, source: 'default' };
  if (!/^\d+$/.test(raw)) {
    return { problem: 'GA_PROPERTY_ID doit être un nombre (ex. 123456789), pas l’ID de mesure « G-… » de la balise.' };
  }
  if (raw.length >= 11) {
    return {
      problem: `GA_PROPERTY_ID (${raw}) ressemble à un ID de flux (11 chiffres). L’ID de propriété compte 9 chiffres : Administration → Paramètres de la propriété, ou le nombre qui suit « /p » dans l’adresse de Google Analytics.`,
    };
  }
  return { id: raw, source: 'env' };
}

type Credentials = Pick<AnalyticsConfig, 'clientEmail' | 'privateKey'>;

function readCredentials(): Credentials | { problem: string } | null {
  const json = (process.env.GA_SERVICE_ACCOUNT_KEY || '').trim();
  if (json) {
    let text = json;
    if (!text.startsWith('{')) {
      // Clé fournie encodée en base64 (évite les soucis de retours à la ligne).
      try {
        text = Buffer.from(text, 'base64').toString('utf8');
      } catch {
        // on tentera le JSON brut
      }
    }
    try {
      const parsed = JSON.parse(text) as { client_email?: string; private_key?: string };
      if (parsed.client_email && parsed.private_key && PEM_RE.test(parsed.private_key)) {
        return { clientEmail: parsed.client_email, privateKey: parsed.private_key };
      }
      return { problem: 'GA_SERVICE_ACCOUNT_KEY ne contient pas les champs client_email et private_key attendus.' };
    } catch {
      return {
        problem:
          'GA_SERVICE_ACCOUNT_KEY n’est pas un JSON valide : collez le contenu complet du fichier de clé téléchargé depuis Google Cloud.',
      };
    }
  }

  const clientEmail = (process.env.GA_CLIENT_EMAIL || '').trim();
  const privateKey = (process.env.GA_PRIVATE_KEY || '').trim().replace(/\\n/g, '\n');
  if (!clientEmail && !privateKey) return null;
  if (!clientEmail || !privateKey) {
    return { problem: 'GA_CLIENT_EMAIL et GA_PRIVATE_KEY doivent être définies ensemble.' };
  }
  if (!PEM_RE.test(privateKey)) {
    return { problem: 'GA_PRIVATE_KEY ne ressemble pas à une clé privée PEM (-----BEGIN PRIVATE KEY-----).' };
  }
  return { clientEmail, privateKey };
}

/** Ce qui est renseigné (pour le guide de configuration de l'admin). */
export function getConfigStatus(): ConfigStatus {
  const prop = readPropertyId();
  const creds = readCredentials();
  const problems = [prop, creds]
    .map((v) => (v && 'problem' in v ? v.problem : undefined))
    .filter((p): p is string => !!p);
  return {
    propertyId: 'id' in prop ? prop.id : null,
    propertySource: 'id' in prop ? prop.source : null,
    credentials: creds !== null && !('problem' in creds),
    problem: problems.length ? problems.join(' ') : undefined,
  };
}

export function getAnalyticsConfig(): AnalyticsConfig | null {
  const prop = readPropertyId();
  const creds = readCredentials();
  if (!('id' in prop) || !creds || 'problem' in creds) return null;
  return { propertyId: prop.id, ...creds };
}

/** Page d'accueil des rapports de la propriété dans Google Analytics. */
export function analyticsHomeUrl(propertyId: string): string {
  return `https://analytics.google.com/analytics/web/#/p${propertyId}/reports/intelligenthome`;
}

// ─── Authentification (compte de service) ────────────────────────────────────

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const API_BASE = 'https://analyticsdata.googleapis.com/v1beta';

const base64url = (input: Buffer | string) =>
  Buffer.from(input).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

/** JWT RS256 présenté à Google en échange d'un jeton d'accès (exporté pour les tests). */
export function createServiceAccountJwt({ clientEmail, privateKey }: Credentials, nowMs = Date.now()): string {
  const iat = Math.floor(nowMs / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({ iss: clientEmail, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600 }),
  );
  const signature = createSign('RSA-SHA256').update(`${header}.${claims}`).sign(privateKey);
  return `${header}.${claims}.${base64url(signature)}`;
}

export class AnalyticsError extends Error {
  /** Code HTTP renvoyé par Google, ou 0 hors réseau. */
  status: number;
  /** Explication en français, affichable telle quelle dans l'admin. */
  hint: string;

  constructor(message: string, status: number, hint: string) {
    super(message);
    this.name = 'AnalyticsError';
    this.status = status;
    this.hint = hint;
  }
}

let tokenCache: { key: string; token: string; expiresAt: number } | null = null;
let tokenInFlight: Promise<string> | null = null;

async function getAccessToken(config: AnalyticsConfig): Promise<string> {
  const key = `${config.clientEmail}|${config.privateKey.length}`;
  if (tokenCache && tokenCache.key === key && tokenCache.expiresAt > Date.now()) return tokenCache.token;
  if (!tokenInFlight) {
    tokenInFlight = requestAccessToken(config, key).finally(() => {
      tokenInFlight = null;
    });
  }
  return tokenInFlight;
}

async function requestAccessToken(config: AnalyticsConfig, key: string): Promise<string> {

  let jwt: string;
  try {
    jwt = createServiceAccountJwt(config);
  } catch (err) {
    throw new AnalyticsError(
      `Signature du JWT impossible : ${err instanceof Error ? err.message : String(err)}`,
      0,
      'La clé privée du compte de service est illisible : recollez le contenu complet du fichier JSON téléchargé depuis Google Cloud.',
    );
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    const code = data.error || `HTTP ${res.status}`;
    const description = (data.error_description || '').toLowerCase();
    const hint =
      code === 'invalid_grant' && description.includes('account not found')
        ? 'Le compte de service indiqué n’existe pas (ou plus) dans Google Cloud : vérifiez le champ client_email de la clé JSON.'
        : code === 'invalid_grant'
          ? 'Google refuse la signature : la clé privée ne correspond pas au compte de service, ou la clé a été supprimée dans Google Cloud.'
          : code === 'invalid_client'
          ? 'L’e-mail du compte de service est inconnu de Google : vérifiez le champ client_email de la clé JSON.'
          : 'Google n’a pas délivré de jeton d’accès. Vérifiez la clé du compte de service.';
    throw new AnalyticsError(
      `Jeton OAuth refusé (${code})${data.error_description ? ` : ${data.error_description}` : ''}`,
      res.status,
      hint,
    );
  }

  const ttlSeconds = Math.max(60, (data.expires_in ?? 3600) - 60);
  tokenCache = { key, token: data.access_token, expiresAt: Date.now() + ttlSeconds * 1000 };
  return data.access_token;
}

// ─── Appels à l'API ──────────────────────────────────────────────────────────

type GoogleErrorBody = { error?: { code?: number; message?: string; status?: string } };

function explain(status: number, message: string): string {
  const m = message.toLowerCase();
  if (m.includes('has not been used in project') || m.includes('is disabled') || m.includes('not been enabled')) {
    return 'L’API « Google Analytics Data API » n’est pas activée dans le projet Google Cloud du compte de service : activez-la (API et services → Bibliothèque).';
  }
  if (status === 403) {
    return 'Le compte de service n’a pas accès à cette propriété : dans Google Analytics, Administration → Gestion des accès à la propriété, ajoutez son e-mail avec le rôle « Lecteur ». Vérifiez aussi que GA_PROPERTY_ID est bien l’ID de propriété (9 chiffres) et non l’ID de flux.';
  }
  if (status === 404 || (status === 400 && m.includes('property'))) {
    return 'Propriété introuvable : vérifiez GA_PROPERTY_ID (identifiant numérique, Administration → Paramètres de la propriété).';
  }
  if (status === 401) return 'Identifiants refusés : la clé du compte de service est invalide ou révoquée.';
  if (status === 429) return 'Quota quotidien de l’API Google Analytics atteint : réessayez plus tard.';
  return 'Google Analytics n’a pas répondu correctement. Réessayez dans quelques minutes.';
}

async function apiPost<T>(
  config: AnalyticsConfig,
  method: 'batchRunReports' | 'runRealtimeReport',
  body: unknown,
): Promise<T> {
  const token = await getAccessToken(config);
  const res = await fetch(`${API_BASE}/properties/${config.propertyId}:${method}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (res.ok) return (await res.json()) as T;

  if (res.status === 401) tokenCache = null;
  const data = (await res.json().catch(() => ({}))) as GoogleErrorBody;
  const message = data.error?.message || `HTTP ${res.status}`;
  throw new AnalyticsError(`Analytics Data API (${method}) : ${message}`, res.status, explain(res.status, message));
}

// ─── Rapports (sous-ensemble du schéma de l'API) ─────────────────────────────

type DateRange = { startDate: string; endDate: string; name?: string };

type ReportRequest = {
  dateRanges: DateRange[];
  dimensions?: { name: string }[];
  metrics: { name: string }[];
  orderBys?: unknown[];
  limit?: number;
  keepEmptyRows?: boolean;
  dimensionFilter?: unknown;
  metricFilter?: unknown;
};

type ReportResponse = {
  dimensionHeaders?: { name: string }[];
  metricHeaders?: { name: string }[];
  rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[];
};

type BatchResponse = { reports?: ReportResponse[] };

/** Une ligne → objet `{ nomDimension: valeur, nomMétrique: valeur }`. */
type Row = Record<string, string>;

function rowsOf(report: ReportResponse | undefined): Row[] {
  if (!report?.rows) return [];
  const dims = (report.dimensionHeaders ?? []).map((h) => h.name);
  const mets = (report.metricHeaders ?? []).map((h) => h.name);
  return report.rows.map((r) => {
    const row: Row = {};
    dims.forEach((name, i) => {
      row[name] = r.dimensionValues?.[i]?.value ?? '';
    });
    mets.forEach((name, i) => {
      row[name] = r.metricValues?.[i]?.value ?? '0';
    });
    return row;
  });
}

const num = (v: string | undefined): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// ─── Données pour la vue ─────────────────────────────────────────────────────

export type Totals = { users: number; views: number; sessions: number };
export type DayStat = Totals & { day: string };
export type RankStat = { key: string; value: number; extra?: number; sub?: string };

export type AnalyticsStats = {
  period: Period;
  propertyId: string;
  /** Une entrée par jour sur la période (jours vides à zéro), du plus ancien au plus récent. */
  daily: DayStat[];
  current: Totals & { newUsers: number; avgSessionSeconds: number };
  previous: Totals;
  allTime: { users: number; views: number; since: string | null };
  /** value = pages vues, extra = visiteurs. */
  pages: RankStat[];
  /** value = visites (sessions). */
  sources: RankStat[];
  /** value = visiteurs. */
  devices: RankStat[];
  /** value = visiteurs, sub = pays hors France. */
  cities: RankStat[];
  /** Visiteurs actifs sur les 30 dernières minutes ; null si indisponible. */
  realtime: number | null;
  fetchedAt: string;
};

/** Lancement de GA4 : borne basse de « depuis le début ». */
const GA4_EPOCH = '2020-10-14';

const byMetricDesc = (name: string) => [{ metric: { metricName: name }, desc: true }];
const byDate = [{ dimension: { dimensionName: 'date' } }];

function mainRequests(period: Period): ReportRequest[] {
  const current: DateRange = { startDate: `${period - 1}daysAgo`, endDate: 'today', name: 'current' };
  const previous: DateRange = {
    startDate: `${2 * period - 1}daysAgo`,
    endDate: `${period}daysAgo`,
    name: 'previous',
  };
  // La balise n'est pas posée sur l'admin, mais on écarte ces chemins par sécurité.
  const noAdmin = {
    notExpression: {
      filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/admin' } },
    },
  };
  return [
    // 0 · série journalière
    {
      dateRanges: [current],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'sessions' }],
      orderBys: byDate,
      keepEmptyRows: true,
    },
    // 1 · totaux, période courante et période précédente
    {
      dateRanges: [current, previous],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'newUsers' },
        { name: 'averageSessionDuration' },
      ],
    },
    // 2 · pages les plus vues
    {
      dateRanges: [current],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      orderBys: byMetricDesc('screenPageViews'),
      dimensionFilter: noAdmin,
      limit: 12,
    },
    // 3 · provenance des visites
    {
      dateRanges: [current],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'sessions' }],
      orderBys: byMetricDesc('sessions'),
      limit: 8,
    },
    // 4 · appareils
    {
      dateRanges: [current],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: byMetricDesc('activeUsers'),
      limit: 5,
    },
  ];
}

function secondaryRequests(period: Period): ReportRequest[] {
  const all: DateRange = { startDate: GA4_EPOCH, endDate: 'today' };
  const current: DateRange = { startDate: `${period - 1}daysAgo`, endDate: 'today' };
  return [
    // 0 · depuis le début
    { dateRanges: [all], metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }] },
    // 1 · premier jour avec des données
    {
      dateRanges: [all],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'screenPageViews' }],
      metricFilter: {
        filter: {
          fieldName: 'screenPageViews',
          numericFilter: { operation: 'GREATER_THAN', value: { int64Value: '0' } },
        },
      },
      orderBys: byDate,
      limit: 1,
    },
    // 2 · villes
    {
      dateRanges: [current],
      dimensions: [{ name: 'city' }, { name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: byMetricDesc('activeUsers'),
      dimensionFilter: {
        notExpression: {
          filter: { fieldName: 'city', stringFilter: { matchType: 'EXACT', value: '(not set)' } },
        },
      },
      limit: 8,
    },
  ];
}

const DAY_MS = 86_400_000;
const parisDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Les `n` derniers jours (heure de Paris) jusqu'à aujourd'hui inclus, en « YYYY-MM-DD ». */
export function lastDays(n: number, now = new Date()): string[] {
  const end = Date.parse(`${parisDay.format(now)}T00:00:00Z`);
  return Array.from({ length: n }, (_, i) => new Date(end - (n - 1 - i) * DAY_MS).toISOString().slice(0, 10));
}

/** « 20260922 » (format de l'API) → « 2026-09-22 ». */
export function gaDate(value: string): string {
  return /^\d{8}$/.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` : value;
}

/** Chemin de page normalisé (sans barre finale) pour regrouper `/x` et `/x/`. */
export function normalizePath(path: string): string {
  const p = path.trim() || '/';
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p;
}

/** Fusionne les lignes de même clé (après normalisation) et retrie. */
function mergeRank(rows: RankStat[]): RankStat[] {
  const map = new Map<string, RankStat>();
  for (const r of rows) {
    const hit = map.get(r.key);
    if (hit) {
      hit.value += r.value;
      if (r.extra !== undefined) hit.extra = (hit.extra ?? 0) + r.extra;
    } else {
      map.set(r.key, { ...r });
    }
  }
  return [...map.values()].sort((a, b) => b.value - a.value || a.key.localeCompare(b.key));
}

async function fetchReports(config: AnalyticsConfig, period: Period): Promise<Omit<AnalyticsStats, 'realtime'>> {
  const [main, secondary] = await Promise.all([
    apiPost<BatchResponse>(config, 'batchRunReports', { requests: mainRequests(period) }),
    apiPost<BatchResponse>(config, 'batchRunReports', { requests: secondaryRequests(period) }),
  ]);
  const report = (batch: BatchResponse, i: number) => rowsOf(batch.reports?.[i]);

  // Série journalière : jours calés sur l'heure de Paris, jours sans visite à zéro.
  const byDay = new Map(report(main, 0).map((r) => [gaDate(r.date), r]));
  const daily: DayStat[] = lastDays(period).map((day) => {
    const r = byDay.get(day);
    return { day, users: num(r?.activeUsers), views: num(r?.screenPageViews), sessions: num(r?.sessions) };
  });

  const totals = report(main, 1);
  const totalsOf = (name: string): Totals => {
    const r = totals.find((row) => row.dateRange === name);
    return { users: num(r?.activeUsers), views: num(r?.screenPageViews), sessions: num(r?.sessions) };
  };
  const cur = totals.find((row) => row.dateRange === 'current');

  const pages = mergeRank(
    report(main, 2).map((r) => ({
      key: normalizePath(r.pagePath),
      value: num(r.screenPageViews),
      extra: num(r.activeUsers),
    })),
  ).slice(0, 10);

  const sources = report(main, 3).map((r) => ({ key: r.sessionSource, value: num(r.sessions) }));
  const devices = report(main, 4).map((r) => ({ key: r.deviceCategory, value: num(r.activeUsers) }));

  const all = report(secondary, 0)[0];
  const first = report(secondary, 1)[0];
  const cities = report(secondary, 2).map((r) => ({
    key: r.city,
    value: num(r.activeUsers),
    sub: r.country && r.country !== 'France' ? r.country : undefined,
  }));

  return {
    period,
    propertyId: config.propertyId,
    daily,
    current: {
      ...totalsOf('current'),
      newUsers: num(cur?.newUsers),
      avgSessionSeconds: num(cur?.averageSessionDuration),
    },
    previous: totalsOf('previous'),
    allTime: {
      users: num(all?.activeUsers),
      views: num(all?.screenPageViews),
      since: first?.date ? gaDate(first.date) : null,
    },
    pages,
    sources,
    devices,
    cities,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchRealtime(config: AnalyticsConfig): Promise<number | null> {
  try {
    const res = await apiPost<ReportResponse>(config, 'runRealtimeReport', {
      metrics: [{ name: 'activeUsers' }],
    });
    return num(rowsOf(res)[0]?.activeUsers);
  } catch (err) {
    console.error('Google Analytics : temps réel indisponible', err);
    return null;
  }
}

// ─── Cache mémoire (par instance serveur) ────────────────────────────────────

const memory = new Map<string, { expiresAt: number; value: Promise<unknown> }>();

function remember<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = memory.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as Promise<T>;
  const value = load();
  const entry = { expiresAt: Date.now() + ttlMs, value };
  memory.set(key, entry);
  // Un échec n'est pas mémorisé : la prochaine visite réessaie.
  value.catch(() => {
    if (memory.get(key) === entry) memory.delete(key);
  });
  return value;
}

const REPORTS_TTL = 10 * 60_000;
const REALTIME_TTL = 60_000;

/** Tout ce qu'affiche la vue « Google Analytics » pour une période donnée. */
export async function getAnalyticsStats(period: Period): Promise<AnalyticsStats> {
  const config = getAnalyticsConfig();
  if (!config) {
    throw new AnalyticsError('Google Analytics non configuré', 0, 'La clé du compte de service (GA_SERVICE_ACCOUNT_KEY) n’est pas renseignée.');
  }
  const [reports, realtime] = await Promise.all([
    remember(`reports:${config.propertyId}:${period}`, REPORTS_TTL, () => fetchReports(config, period)),
    remember(`realtime:${config.propertyId}`, REALTIME_TTL, () => fetchRealtime(config)),
  ]);
  return { ...reports, realtime };
}

// ─── Libellés ────────────────────────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  '/': 'Accueil',
  '/a-propos': 'À propos',
  '/contact': 'Contact',
  '/directeur-artistique': 'Directeur artistique',
  '/blog': 'Blog',
  '/journal': 'Blog (ancienne adresse)',
  '/medias': 'Médias',
  '/musiciens': 'Musiciens',
  '/musiciens/contribuer': 'Musiciens · Contribuer',
  '/nous-soutenir': 'Nous soutenir',
};

export function pageLabel(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  const musician = path.match(/^\/musiciens\/([^/]+)$/);
  if (musician) return `Musicien · ${slugToWords(musician[1])}`;
  const post = path.match(/^\/(?:blog|journal)\/([^/]+)$/);
  if (post) return `Blog · ${slugToWords(post[1])}`;
  const page = path.match(/^\/([^/]+)$/);
  if (page) return capitalize(slugToWords(page[1]));
  return path;
}

function slugToWords(slug: string): string {
  try {
    return decodeURIComponent(slug).replace(/[-_]+/g, ' ');
  } catch {
    return slug;
  }
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

const SOURCE_LABELS: Record<string, string> = {
  '(direct)': 'Accès direct',
  '(not set)': 'Non renseigné',
  google: 'Google',
  bing: 'Bing',
  duckduckgo: 'DuckDuckGo',
  ecosia: 'Ecosia',
  'ecosia.org': 'Ecosia',
  qwant: 'Qwant',
  'qwant.com': 'Qwant',
  yahoo: 'Yahoo',
  facebook: 'Facebook',
  'facebook.com': 'Facebook',
  'm.facebook.com': 'Facebook',
  'l.facebook.com': 'Facebook',
  'lm.facebook.com': 'Facebook',
  instagram: 'Instagram',
  'instagram.com': 'Instagram',
  'l.instagram.com': 'Instagram',
  linkedin: 'LinkedIn',
  'linkedin.com': 'LinkedIn',
  'lnkd.in': 'LinkedIn',
  't.co': 'X (Twitter)',
  'x.com': 'X (Twitter)',
  'twitter.com': 'X (Twitter)',
  youtube: 'YouTube',
  'youtube.com': 'YouTube',
  'm.youtube.com': 'YouTube',
  'helloasso.com': 'HelloAsso',
  'linktr.ee': 'Linktree',
  chatgpt: 'ChatGPT',
  'chatgpt.com': 'ChatGPT',
};

export function sourceLabel(source: string): string {
  if (!source) return 'Non renseigné';
  const key = source.toLowerCase();
  if (SOURCE_LABELS[key]) return SOURCE_LABELS[key];
  if (/^(www\.)?google\./.test(key)) return 'Google';
  return source;
}

const DEVICE_LABELS: Record<string, string> = {
  desktop: 'Ordinateur',
  mobile: 'Mobile',
  tablet: 'Tablette',
  'smart tv': 'Télévision',
};

export function deviceLabel(device: string): string {
  return DEVICE_LABELS[device.toLowerCase()] || device;
}

// ─── Formats (côté serveur) ──────────────────────────────────────────────────

const shortDay = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const longDay = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const clock = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
const countFormat = new Intl.NumberFormat('fr-FR');

/** « 2026-09-22 » → « 22 sept. » ou « mardi 22 septembre 2026 ». */
export function formatDay(key: string, style: 'short' | 'long' = 'short'): string {
  const d = new Date(`${key}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return key;
  return (style === 'long' ? longDay : shortDay).format(d);
}

/** ISO → « 16:42 » (heure de Paris). */
export function formatClock(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : clock.format(d);
}

export function formatCount(n: number): string {
  return countFormat.format(Math.round(n));
}

/** « 3 visiteurs », « 1 page vue ». */
export function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${formatCount(n)} ${n > 1 ? pluralForm : singular}`;
}

/** 95 → « 1 min 35 s », 42 → « 42 s ». */
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  if (total < 60) return `${total} s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
}

/** Variation en % (null si la période précédente est vide). */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
