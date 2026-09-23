/**
 * Statistiques de fréquentation du site — agrégation des pages vues.
 *
 * Les requêtes tournent directement en SQL (drizzle) sur la table `page_views`
 * créée par la collection `page-views` : agréger côté base est bien plus léger
 * que de charger chaque ligne via l'API Payload. Les journées sont toujours
 * calculées en heure de Paris, comme les dates de concerts.
 */
import { sql } from '@payloadcms/db-postgres/drizzle';
import type { Payload } from 'payload';

export const SITE_TIMEZONE = 'Europe/Paris';

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];

/** `?periode=7|30|90` → période valide (30 jours par défaut). */
export function parsePeriod(raw: unknown): Period {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return (PERIODS as readonly number[]).includes(value) ? (value as Period) : 30;
}

export type Totals = { views: number; visitors: number };
export type DayStat = Totals & { day: string };
export type PageStat = Totals & { path: string };
export type SourceStat = { referrer: string; entries: number };
export type DeviceStat = { device: string; visitors: number };

export type VisitSummary = { today: Totals; last7: Totals; last30: Totals };

export type VisitStats = {
  period: Period;
  /** Une entrée par jour sur la période, du plus ancien au plus récent. */
  daily: DayStat[];
  current: Totals;
  previous: Totals;
  today: Totals;
  allTime: Totals & { since: string | null };
  pages: PageStat[];
  sources: SourceStat[];
  devices: DeviceStat[];
};

// ─── Accès SQL ───────────────────────────────────────────────────────────────

type SqlQuery = ReturnType<typeof sql>;
type Row = Record<string, unknown>;

async function run(payload: Payload, query: SqlQuery): Promise<Row[]> {
  const db = (payload.db as unknown as { drizzle?: { execute: (q: SqlQuery) => Promise<unknown> } })
    .drizzle;
  if (!db) throw new Error('Statistiques : adaptateur Postgres (drizzle) indisponible.');
  const result = (await db.execute(query)) as { rows?: Row[] } | Row[];
  return Array.isArray(result) ? result : (result.rows ?? []);
}

const TZ = sql.raw(`'${SITE_TIMEZONE}'`);

/** Début (heure de Paris) de la journée d'il y a `days - 1` jours, en timestamptz. */
const since = (days: number) =>
  sql`(((now() AT TIME ZONE ${TZ})::date - (${days}::int - 1))::timestamp AT TIME ZONE ${TZ})`;

/** Jour (Paris) + empreinte : un visiteur compte une fois par jour. */
const dailyVisitor = sql`((created_at AT TIME ZONE ${TZ})::date::text || '|' || visitor)`;

const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);

// ─── Requêtes ────────────────────────────────────────────────────────────────

/** Une ligne par jour (les jours sans visite sont à zéro), du plus ancien au plus récent. */
export async function getDailySeries(payload: Payload, days: number): Promise<DayStat[]> {
  const rows = await run(
    payload,
    sql`
      WITH bounds AS (
        SELECT (now() AT TIME ZONE ${TZ})::date AS today
      ),
      days AS (
        SELECT generate_series(today - (${days}::int - 1), today, interval '1 day')::date AS day
        FROM bounds
      ),
      hits AS (
        SELECT (created_at AT TIME ZONE ${TZ})::date AS day, visitor
        FROM page_views
        WHERE created_at >= ${since(days)}
      )
      SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
             COUNT(hits.visitor)::int AS views,
             COUNT(DISTINCT hits.visitor)::int AS visitors
      FROM days
      LEFT JOIN hits ON hits.day = days.day
      GROUP BY days.day
      ORDER BY days.day
    `,
  );
  return rows.map((r) => ({ day: String(r.day), views: num(r.views), visitors: num(r.visitors) }));
}

export async function getTopPages(payload: Payload, days: number, limit = 10): Promise<PageStat[]> {
  const rows = await run(
    payload,
    sql`
      SELECT path,
             COUNT(*)::int AS views,
             COUNT(DISTINCT ${dailyVisitor})::int AS visitors
      FROM page_views
      WHERE created_at >= ${since(days)}
      GROUP BY path
      ORDER BY views DESC, path ASC
      LIMIT ${limit}::int
    `,
  );
  return rows.map((r) => ({ path: String(r.path), views: num(r.views), visitors: num(r.visitors) }));
}

/** Sites de provenance des arrivées ('' = accès direct). */
export async function getSources(payload: Payload, days: number, limit = 8): Promise<SourceStat[]> {
  const rows = await run(
    payload,
    sql`
      SELECT COALESCE(referrer, '') AS referrer, COUNT(*)::int AS entries
      FROM page_views
      WHERE entry = true AND created_at >= ${since(days)}
      GROUP BY 1
      ORDER BY entries DESC, referrer ASC
      LIMIT ${limit}::int
    `,
  );
  return rows.map((r) => ({ referrer: String(r.referrer ?? ''), entries: num(r.entries) }));
}

export async function getDevices(payload: Payload, days: number): Promise<DeviceStat[]> {
  const rows = await run(
    payload,
    sql`
      SELECT COALESCE(device, 'desktop') AS device,
             COUNT(DISTINCT ${dailyVisitor})::int AS visitors
      FROM page_views
      WHERE created_at >= ${since(days)}
      GROUP BY 1
      ORDER BY visitors DESC
    `,
  );
  return rows.map((r) => ({ device: String(r.device), visitors: num(r.visitors) }));
}

export async function getAllTime(payload: Payload): Promise<VisitStats['allTime']> {
  const rows = await run(
    payload,
    sql`
      SELECT COUNT(*)::int AS views,
             to_char((MIN(created_at) AT TIME ZONE ${TZ}), 'YYYY-MM-DD') AS since,
             (SELECT COUNT(*) FROM (SELECT DISTINCT ${dailyVisitor} AS v FROM page_views) s)::int AS visitors
      FROM page_views
    `,
  );
  const r = rows[0] ?? {};
  return { views: num(r.views), visitors: num(r.visitors), since: r.since ? String(r.since) : null };
}

// ─── Assemblage ──────────────────────────────────────────────────────────────

export function sumTotals(days: Totals[]): Totals {
  return days.reduce(
    (acc, d) => ({ views: acc.views + d.views, visitors: acc.visitors + d.visitors }),
    { views: 0, visitors: 0 },
  );
}

/** Variation en % (null si la période précédente est vide). */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Tout ce qu'affiche la vue « Statistiques » pour une période donnée. */
export async function getVisitStats(payload: Payload, period: Period): Promise<VisitStats> {
  const [series, allTime, pages, sources, devices] = await Promise.all([
    getDailySeries(payload, period * 2),
    getAllTime(payload),
    getTopPages(payload, period),
    getSources(payload, period),
    getDevices(payload, period),
  ]);
  const daily = series.slice(period);
  const previous = sumTotals(series.slice(0, period));
  const current = sumTotals(daily);
  const last = daily[daily.length - 1];
  const today = last ? { views: last.views, visitors: last.visitors } : { views: 0, visitors: 0 };
  return { period, daily, current, previous, today, allTime, pages, sources, devices };
}

/** Résumé compact pour le bandeau du tableau de bord. */
export async function getVisitSummary(payload: Payload): Promise<VisitSummary> {
  const series = await getDailySeries(payload, 30);
  const last = series[series.length - 1];
  return {
    today: last ? { views: last.views, visitors: last.visitors } : { views: 0, visitors: 0 },
    last7: sumTotals(series.slice(-7)),
    last30: sumTotals(series),
  };
}

// ─── Libellés ────────────────────────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  '/': 'Accueil',
  '/a-propos': 'À propos',
  '/contact': 'Contact',
  '/directeur-artistique': 'Directeur artistique',
  '/medias': 'Médias',
  '/musiciens': 'Musiciens',
  '/musiciens/contribuer': 'Musiciens · Contribuer',
  '/nous-soutenir': 'Nous soutenir',
};

export function pageLabel(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  const musician = path.match(/^\/musiciens\/([^/]+)$/);
  if (musician) return `Musicien · ${slugToWords(musician[1])}`;
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
  'bing.com': 'Bing',
  'duckduckgo.com': 'DuckDuckGo',
  'ecosia.org': 'Ecosia',
  'qwant.com': 'Qwant',
  'facebook.com': 'Facebook',
  'm.facebook.com': 'Facebook',
  'l.facebook.com': 'Facebook',
  'lm.facebook.com': 'Facebook',
  'instagram.com': 'Instagram',
  'l.instagram.com': 'Instagram',
  'linkedin.com': 'LinkedIn',
  'lnkd.in': 'LinkedIn',
  't.co': 'X (Twitter)',
  'x.com': 'X (Twitter)',
  'twitter.com': 'X (Twitter)',
  'youtube.com': 'YouTube',
  'm.youtube.com': 'YouTube',
  'helloasso.com': 'HelloAsso',
};

export function sourceLabel(referrer: string): string {
  if (!referrer) return 'Accès direct';
  if (/^google\./.test(referrer)) return 'Google';
  return SOURCE_LABELS[referrer] || referrer;
}

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'Mobile',
  tablet: 'Tablette',
  desktop: 'Ordinateur',
};

export function deviceLabel(device: string): string {
  return DEVICE_LABELS[device] || device;
}

// ─── Formats (côté serveur uniquement) ───────────────────────────────────────

const shortDay = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const longDay = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const countFormat = new Intl.NumberFormat('fr-FR');

/** « 2026-09-22 » → « 22 sept. » ou « mardi 22 septembre 2026 ». */
export function formatDay(key: string, style: 'short' | 'long' = 'short'): string {
  const d = new Date(`${key}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return key;
  return (style === 'long' ? longDay : shortDay).format(d);
}

export function formatCount(n: number): string {
  return countFormat.format(n);
}

/** « 3 visiteurs », « 1 page vue ». */
export function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${formatCount(n)} ${n > 1 ? pluralForm : singular}`;
}
