/**
 * Concert dates — helpers shared by the public site, the admin and scripts.
 *
 * A concert is stored with a real `date` (ISO instant) plus an optional free
 * text `time` (« 20h30 »). The calendar day of a concert is always read in
 * Europe/Paris, whatever the timezone of the server (Vercel runs in UTC) or of
 * the editor's browser. Dates are normalised to noon UTC on save so that any
 * viewer between UTC-11 and UTC+11 sees the same day.
 *
 * A concert is « past » from the day after its date (Paris time) and is then
 * no longer shown on the public site.
 */

export const CONCERT_TIMEZONE = 'Europe/Paris';

export type ConcertStatus = 'published' | 'draft' | 'cancelled';

export type ConcertDoc = {
  id: string | number;
  title?: string | null;
  date?: string | Date | null;
  time?: string | null;
  venue?: string | null;
  program?: string | null;
  bookingLink?: string | null;
  image?:
    | { url?: string | null; alt?: string | null; width?: number | null; height?: number | null }
    | number
    | string
    | null;
  status?: ConcertStatus | null;
};

export type ConcertDateView = {
  /** Canonical ISO instant (noon UTC of the concert day). */
  iso: string;
  /** Calendar day as « YYYY-MM-DD » (Paris). */
  key: string;
  /** « 18 » */
  day: string;
  /** « avril » */
  month: string;
  /** « 2026 » */
  year: string;
  /** « Avril 2026 » */
  monthYear: string;
  /** « samedi » */
  weekday: string;
  /** « samedi 18 avril 2026 » */
  long: string;
  /** « 20h30 » or null when unknown. */
  time: string | null;
  isToday: boolean;
  isPast: boolean;
};

export type ConcertCard = {
  id: string | number;
  title: string;
  venue: string;
  program: string;
  bookingLink: string | null;
  image: { url: string; alt: string; width: number | null; height: number | null } | null;
  status: ConcertStatus;
  date: ConcertDateView;
};

// ─── Calendar helpers ────────────────────────────────────────────────────────

function toDate(input: Date | string | number | null | undefined): Date | null {
  if (input === null || input === undefined || input === '') return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** « YYYY-MM-DD » of an instant, as seen from Paris. */
export function parisDateKey(input: Date | string | number | null | undefined): string | null {
  const d = toDate(input);
  if (!d) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CONCERT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** Today's « YYYY-MM-DD » in Paris. */
export function todayKey(now: Date = new Date()): string {
  return parisDateKey(now) as string;
}

/** Shift a « YYYY-MM-DD » key by a number of days. */
export function shiftKey(key: string, days: number): string {
  const d = new Date(`${key}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Canonical instant for a calendar day: noon UTC. */
export function canonicalDateForKey(key: string): string {
  return `${key}T12:00:00.000Z`;
}

/** Start of a Paris calendar day, expressed as an ISO instant usable in DB filters. */
export function startOfKeyIso(key: string): string {
  return `${key}T00:00:00.000Z`;
}

/**
 * Field hook: whatever instant the admin datepicker sends (local midnight of
 * the editor's browser), keep the Paris calendar day and store noon UTC.
 */
export function normalizeConcertDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  const key = parisDateKey(value as Date | string | null);
  return key ? canonicalDateForKey(key) : null;
}

// ─── Time helpers (« 20h30 ») ────────────────────────────────────────────────

const TIME_RE = /^(\d{1,2})\s*(?:h|:|\.)?\s*(\d{2})?\s*$/i;

/** Field hook: « 20:30 », « 20 h 30 », « 20h » → « 20h30 » / « 20h00 ». */
export function normalizeConcertTime(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  const m = raw.match(TIME_RE);
  if (!m) return raw;
  const hours = Number(m[1]);
  const minutes = m[2] ? Number(m[2]) : 0;
  if (hours > 23 || minutes > 59) return raw;
  return `${hours}h${String(minutes).padStart(2, '0')}`;
}

export function isValidConcertTime(value: string): boolean {
  const m = value.match(/^(\d{1,2})h(\d{2})$/);
  if (!m) return false;
  return Number(m[1]) <= 23 && Number(m[2]) <= 59;
}

/** Minutes since midnight, for sorting concerts on the same day. */
function timeToMinutes(time: string | null | undefined): number {
  if (!time) return 24 * 60; // unknown time sorts last within the day
  const m = time.match(/^(\d{1,2})h(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 24 * 60;
}

// ─── Formatting ──────────────────────────────────────────────────────────────

const capitalize = (s: string) => (s ? s.charAt(0).toLocaleUpperCase('fr-FR') + s.slice(1) : s);

const partFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: CONCERT_TIMEZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function describeConcertDate(
  date: Date | string | null | undefined,
  time?: string | null,
  now: Date = new Date(),
): ConcertDateView | null {
  const d = toDate(date);
  const key = parisDateKey(d);
  if (!d || !key) return null;

  const parts: Record<string, string> = {};
  for (const p of partFormatter.formatToParts(d)) {
    if (p.type !== 'literal') parts[p.type] = p.value;
  }
  const day = parts.day || '';
  const month = parts.month || '';
  const year = parts.year || '';
  const weekday = parts.weekday || '';
  const today = todayKey(now);
  const cleanTime = normalizeConcertTime(time ?? null) || null;

  return {
    iso: canonicalDateForKey(key),
    key,
    day,
    month,
    year,
    monthYear: capitalize(`${month} ${year}`),
    weekday,
    long: `${weekday} ${day} ${month} ${year}`,
    time: cleanTime,
    isToday: key === today,
    isPast: key < today,
  };
}

export function isPastConcert(doc: Pick<ConcertDoc, 'date'>, now: Date = new Date()): boolean {
  const key = parisDateKey(doc.date ?? null);
  return !!key && key < todayKey(now);
}

export function compareConcerts(a: ConcertDoc, b: ConcertDoc): number {
  const ka = parisDateKey(a.date ?? null) || '';
  const kb = parisDateKey(b.date ?? null) || '';
  if (ka !== kb) return ka < kb ? -1 : 1;
  return timeToMinutes(a.time) - timeToMinutes(b.time);
}

/** Server-side view model handed to client components (no Intl on the client → no hydration drift). */
export function toConcertCard(doc: ConcertDoc, now: Date = new Date()): ConcertCard | null {
  const date = describeConcertDate(doc.date ?? null, doc.time, now);
  if (!date) return null;
  const img = doc.image && typeof doc.image === 'object' && doc.image.url ? doc.image : null;
  return {
    id: doc.id,
    title: doc.title?.trim() || 'Concert',
    venue: doc.venue?.trim() || '',
    program: doc.program?.trim() || '',
    bookingLink: doc.bookingLink?.trim() || null,
    image: img
      ? {
          url: img.url as string,
          alt: img.alt || doc.title || 'Concert',
          width: typeof img.width === 'number' && img.width > 0 ? img.width : null,
          height: typeof img.height === 'number' && img.height > 0 ? img.height : null,
        }
      : null,
    status: doc.status === 'draft' || doc.status === 'cancelled' ? doc.status : 'published',
    date,
  };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

type PayloadLike = {
  find: (args: Record<string, unknown>) => Promise<{ docs: unknown[] }>;
};

/**
 * Concerts to show on the public site: today and later (Paris time), not drafts,
 * soonest first. Cancelled concerts are kept so visitors are informed.
 */
export async function findUpcomingConcerts(
  payload: PayloadLike,
  { limit = 12, now = new Date() }: { limit?: number; now?: Date } = {},
): Promise<ConcertCard[]> {
  const today = todayKey(now);
  // Over-fetch by one day, then filter precisely on the Paris calendar day so
  // that non-canonical instants (e.g. Paris midnight stored as 22:00Z the day
  // before) are never dropped by mistake.
  const from = startOfKeyIso(shiftKey(today, -1));

  const res = await payload.find({
    collection: 'concerts',
    where: {
      and: [
        { date: { greater_than_equal: from } },
        { status: { not_equals: 'draft' } },
      ],
    },
    sort: 'date',
    limit: Math.max(limit * 3, 30),
    depth: 1,
  });

  return (res.docs as ConcertDoc[])
    .filter((d) => {
      const key = parisDateKey(d.date ?? null);
      return !!key && key >= today;
    })
    .sort(compareConcerts)
    .slice(0, limit)
    .map((d) => toConcertCard(d, now))
    .filter((c): c is ConcertCard => c !== null);
}
