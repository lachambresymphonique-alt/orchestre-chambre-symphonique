/**
 * Concert dates — helpers shared by the public site, the admin and scripts.
 *
 * A concert is one programme and one poster given at one or more
 * *performances* (« représentations »), each with a real `date` (ISO
 * instant), an optional free text `time` (« 20h30 »), a `venue` and an
 * optional `bookingLink`. The calendar day of a performance is always read in
 * Europe/Paris, whatever the timezone of the server (Vercel runs in UTC) or of
 * the editor's browser. Dates are normalised to noon UTC on save so that any
 * viewer between UTC-11 and UTC+11 sees the same day.
 *
 * For sorting, filtering and older readers, the concert also carries derived
 * top-level fields kept in sync by a collection hook (see Concerts.ts):
 * `date` (first performance), `lastDate` (last performance), `time`, `venue`
 * (every venue, joined) and `bookingLink` (first performance's link).
 *
 * A concert is « past » from the day after its *last* performance (Paris time)
 * and is then no longer shown on the public site. Meanwhile, only the
 * performances still to come are listed.
 */

export const CONCERT_TIMEZONE = 'Europe/Paris';

export type ConcertStatus = 'published' | 'draft' | 'cancelled';

export type ConcertPerformanceDoc = {
  id?: string | null;
  date?: string | Date | null;
  time?: string | null;
  venue?: string | null;
  bookingLink?: string | null;
};

export type ConcertDoc = {
  id: string | number;
  title?: string | null;
  performances?: ConcertPerformanceDoc[] | null;
  /** Derived: first performance. */
  date?: string | Date | null;
  /** Derived: last performance. */
  lastDate?: string | Date | null;
  /** Derived: first performance. */
  time?: string | null;
  /** Derived: every venue, joined with « · ». */
  venue?: string | null;
  /** Derived: first performance. */
  bookingLink?: string | null;
  program?: string | null;
  image?:
    | { url?: string | null; alt?: string | null; width?: number | null; height?: number | null }
    | number
    | string
    | null;
  status?: ConcertStatus | null;
  /** « À la une sur l'accueil » (case de l'admin). */
  featured?: boolean | null;
  /** Solistes invités (collection `soloists`), peuplés à depth ≥ 1 (photo : depth ≥ 2). */
  soloists?: Array<ConcertSoloistDoc | number | string> | null;
};

export type ConcertSoloistDoc = {
  id: string | number;
  name?: string | null;
  slug?: string | null;
  instrument?: string | null;
  photo?: { url?: string | null; alt?: string | null; sizes?: Record<string, { url?: string | null } | undefined> | null } | number | string | null;
};

/** Un·e soliste prêt·e à afficher sur une carte de concert. */
export type ConcertSoloistView = {
  id: string | number;
  name: string;
  instrument: string;
  /** Page du ou de la soliste (/solistes/<slug>). */
  href: string;
  photo: { url: string; alt: string } | null;
};

/** Solistes peuplés → vues ; les références non peuplées (identifiants seuls) sont ignorées. */
export function soloistsOf(doc: Pick<ConcertDoc, 'soloists'>): ConcertSoloistView[] {
  const list = Array.isArray(doc.soloists) ? doc.soloists : [];
  return list
    .filter((s): s is ConcertSoloistDoc => !!s && typeof s === 'object' && !!(s as ConcertSoloistDoc).name)
    .map((s) => {
      const photo = s.photo && typeof s.photo === 'object' ? s.photo : null;
      // Image d'origine : le format « card » est recadré en paysage, pas un portrait.
      const url = photo?.url || null;
      return {
        id: s.id,
        name: (s.name ?? '').trim(),
        instrument: (s.instrument ?? '').trim(),
        href: `/solistes/${s.slug || s.id}`,
        photo: url ? { url, alt: photo?.alt || s.name || '' } : null,
      };
    });
}

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

/** One performance, ready to render (no Intl on the client → no hydration drift). */
export type ConcertPerformanceView = {
  id: string;
  date: ConcertDateView;
  venue: string;
  bookingLink: string | null;
};

export type ConcertCard = {
  id: string | number;
  title: string;
  /** Venue of the performance shown in `date`. */
  venue: string;
  program: string;
  /** Booking link of the performance shown in `date`. */
  bookingLink: string | null;
  image: { url: string; alt: string; width: number | null; height: number | null } | null;
  status: ConcertStatus;
  /** Next performance (today or later) — or the last one once all have passed. */
  date: ConcertDateView;
  /** Performances still to come (today or later), soonest first. */
  performances: ConcertPerformanceView[];
  /** Every performance, past ones included. */
  performanceCount: number;
  /** Coché « À la une sur l'accueil » dans l'admin. */
  featured: boolean;
  /** Solistes invités, dans l'ordre choisi dans l'admin. */
  soloists: ConcertSoloistView[];
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

/** Minutes since midnight, for sorting performances on the same day. */
function timeToMinutes(time: string | null | undefined): number {
  if (!time) return 24 * 60; // unknown time sorts last within the day
  const m = time.match(/^(\d{1,2})h(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 24 * 60;
}

// ─── Booking link ────────────────────────────────────────────────────────────

/** Field validator: full http(s) URL, or empty. */
export function validateBookingLink(value: string | null | undefined): true | string {
  if (!value) return true;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || url.protocol === 'http:') return true;
  } catch {
    /* fallthrough */
  }
  return 'Indiquez une adresse complète commençant par https://';
}

// ─── Performances ────────────────────────────────────────────────────────────

/** Soonest first; on the same day, by time (unknown time last). Undated rows last. */
export function comparePerformances(a: ConcertPerformanceDoc, b: ConcertPerformanceDoc): number {
  const ka = parisDateKey(a.date ?? null);
  const kb = parisDateKey(b.date ?? null);
  if (ka !== kb) {
    if (!ka) return 1;
    if (!kb) return -1;
    return ka < kb ? -1 : 1;
  }
  return timeToMinutes(a.time) - timeToMinutes(b.time);
}

export function sortPerformances<T extends ConcertPerformanceDoc>(list: T[]): T[] {
  return [...list].sort(comparePerformances);
}

/**
 * The concert's performances, sorted. A document saved before performances
 * existed (only the old single date) still yields one performance, built
 * from its top-level fields, so nothing disappears before the data migration.
 */
export function performancesOf(doc: Partial<ConcertDoc>): ConcertPerformanceDoc[] {
  const rows = Array.isArray(doc.performances) ? doc.performances : [];
  const dated = rows.filter((p) => p && parisDateKey(p.date ?? null));
  if (dated.length > 0) return sortPerformances(dated);
  if (parisDateKey(doc.date ?? null)) {
    return [
      {
        date: doc.date,
        time: doc.time ?? null,
        venue: doc.venue ?? null,
        bookingLink: doc.bookingLink ?? null,
      },
    ];
  }
  return [];
}

export type DerivedConcertFields = {
  date: string | Date | null;
  lastDate: string | Date | null;
  time: string | null;
  venue: string | null;
  bookingLink: string | null;
};

/**
 * Top-level fields kept in sync with the performances: first and last date,
 * first time and booking link, every distinct venue joined with « · » (so the
 * admin search finds a concert by any of its venues).
 */
export function deriveConcertFields(performances: ConcertPerformanceDoc[]): DerivedConcertFields {
  const sorted = sortPerformances(performances.filter((p) => p && parisDateKey(p.date ?? null)));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const venues: string[] = [];
  for (const p of sorted) {
    const v = p.venue?.trim();
    if (v && !venues.includes(v)) venues.push(v);
  }
  return {
    date: first?.date ?? null,
    lastDate: last?.date ?? null,
    time: normalizeConcertTime(first?.time ?? null) || null,
    venue: venues.length ? venues.join(' · ') : null,
    bookingLink: first?.bookingLink?.trim() || null,
  };
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

export function describePerformance(
  perf: ConcertPerformanceDoc,
  now: Date = new Date(),
): ConcertPerformanceView | null {
  const date = describeConcertDate(perf.date ?? null, perf.time, now);
  if (!date) return null;
  return {
    id: perf.id || `${date.key}-${perf.venue || ''}`,
    date,
    venue: perf.venue?.trim() || '',
    bookingLink: perf.bookingLink?.trim() || null,
  };
}

/** True once every performance is over (Paris time). */
export function isPastConcert(
  doc: Pick<ConcertDoc, 'date' | 'lastDate' | 'performances' | 'time' | 'venue' | 'bookingLink'>,
  now: Date = new Date(),
): boolean {
  const list = performancesOf(doc);
  const last = list[list.length - 1];
  const key = parisDateKey((last?.date ?? doc.lastDate ?? doc.date) ?? null);
  return !!key && key < todayKey(now);
}

/** By first performance — the order of the admin list. */
export function compareConcerts(a: ConcertDoc, b: ConcertDoc): number {
  const pa = performancesOf(a)[0] ?? {};
  const pb = performancesOf(b)[0] ?? {};
  return comparePerformances(pa, pb);
}

/** Server-side view model handed to client components (no Intl on the client → no hydration drift). */
export function toConcertCard(doc: ConcertDoc, now: Date = new Date()): ConcertCard | null {
  const all = performancesOf(doc)
    .map((p) => describePerformance(p, now))
    .filter((p): p is ConcertPerformanceView => p !== null);
  if (all.length === 0) return null;

  const today = todayKey(now);
  const upcoming = all.filter((p) => p.date.key >= today);
  // Once everything is over (admin previews, archives), fall back to the last performance.
  const primary = upcoming[0] ?? all[all.length - 1];

  const img = doc.image && typeof doc.image === 'object' && doc.image.url ? doc.image : null;
  return {
    id: doc.id,
    title: doc.title?.trim() || 'Concert',
    venue: primary.venue,
    program: doc.program?.trim() || '',
    bookingLink: primary.bookingLink,
    image: img
      ? {
          url: img.url as string,
          alt: img.alt || doc.title || 'Concert',
          width: typeof img.width === 'number' && img.width > 0 ? img.width : null,
          height: typeof img.height === 'number' && img.height > 0 ? img.height : null,
        }
      : null,
    status: doc.status === 'draft' || doc.status === 'cancelled' ? doc.status : 'published',
    date: primary.date,
    performances: upcoming,
    performanceCount: all.length,
    featured: doc.featured === true,
    soloists: soloistsOf(doc),
  };
}

// ─── Admin ───────────────────────────────────────────────────────────────────

/** Liste des concerts dans l'admin. */
export const CONCERTS_ADMIN_LIST = '/admin/collections/concerts';

/**
 * Adresse de la vue « À venir » de la liste des concerts : même filtre que
 * l'onglet du même nom, et vue de départ vers laquelle `middleware.ts`
 * redirige l'adresse nue de la liste. Un concert reste « à venir » jusqu'à
 * sa dernière représentation.
 */
export function concertsUpcomingListUrl(now: Date = new Date()): string {
  const from = encodeURIComponent(startOfKeyIso(todayKey(now)));
  return `${CONCERTS_ADMIN_LIST}?where[and][0][lastDate][greater_than_equal]=${from}&sort=date`;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

type PayloadLike = {
  find: (args: Record<string, unknown>) => Promise<{ docs: unknown[] }>;
};

/**
 * Concerts to show on the public site: at least one performance today or
 * later (Paris time), not drafts, soonest next performance first. Cancelled
 * concerts are kept so visitors are informed.
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
        {
          or: [
            { lastDate: { greater_than_equal: from } },
            // Documents saved before `lastDate` existed (not migrated yet).
            { and: [{ lastDate: { exists: false } }, { date: { greater_than_equal: from } }] },
          ],
        },
        { status: { not_equals: 'draft' } },
      ],
    },
    sort: 'date',
    limit: Math.max(limit * 3, 30),
    // depth 2 : l'affiche (1) et le portrait des solistes (2).
    depth: 2,
  });

  return (res.docs as ConcertDoc[])
    .map((d) => toConcertCard(d, now))
    .filter((c): c is ConcertCard => c !== null && c.performances.length > 0)
    .sort((a, b) => {
      if (a.date.key !== b.date.key) return a.date.key < b.date.key ? -1 : 1;
      return timeToMinutes(a.date.time) - timeToMinutes(b.date.time);
    })
    .slice(0, limit);
}
