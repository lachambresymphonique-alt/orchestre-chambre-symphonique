/**
 * Mise en forme des articles du blog, sans accès à la base : utilisable côté
 * serveur comme dans le navigateur (aperçu en direct de l'admin).
 * Réexporté par `posts.ts`.
 */
import type { PostCategory } from './postCategories';

export type MediaDoc = {
  id?: string | number;
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  sizes?: Record<string, { url?: string | null; width?: number | null; height?: number | null }>;
};

export type ImageView = { url: string; alt: string; width?: number; height?: number };

export type MusicianRef = { id?: string | number; slug?: string | null; name?: string | null };

export type ConcertRef = {
  id: string | number;
  title?: string | null;
  date?: string | null;
  time?: string | null;
  venue?: string | null;
};

export type PostDoc = {
  id: string | number;
  title: string;
  slug: string;
  category: PostCategory;
  publishedAt?: string | null;
  excerpt?: string | null;
  cover?: MediaDoc | number | string | null;
  content?: unknown;
  guest?: {
    name?: string | null;
    role?: string | null;
    musician?: MusicianRef | number | string | null;
  } | null;
  project?: {
    period?: string | null;
    concerts?: (ConcertRef | number | string)[] | null;
  } | null;
  gallery?: { id?: string; image?: MediaDoc | number | string | null; caption?: string | null }[] | null;
  meta?: { description?: string | null; image?: MediaDoc | number | string | null } | null;
  slugHistory?: { slug?: string | null }[] | null;
  _status?: 'draft' | 'published';
  createdAt?: string;
  updatedAt?: string;
};

/** Image exploitable (URL présente) ou null si la relation n’est pas peuplée. */
export function imageOf(value: unknown, size?: 'thumbnail' | 'card'): ImageView | null {
  if (!value || typeof value !== 'object') return null;
  const doc = value as MediaDoc;
  const sized = size ? doc.sizes?.[size] : undefined;
  const url = sized?.url || doc.url;
  if (!url) return null;
  const width = sized?.url ? sized.width : doc.width;
  const height = sized?.url ? sized.height : doc.height;
  return {
    url,
    alt: doc.alt || '',
    width: width || undefined,
    height: height || undefined,
  };
}

export type PostDateView = {
  iso: string;
  /** « 18 » */
  day: string;
  /** « avril » */
  month: string;
  /** « 2026 » */
  year: string;
  /** « Avril 2026 » */
  monthYear: string;
  /** « 18 avril 2026 » */
  long: string;
};

const partFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export function describePostDate(value: string | Date | null | undefined): PostDateView | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const parts: Record<string, string> = {};
  for (const p of partFormatter.formatToParts(d)) {
    if (p.type !== 'literal') parts[p.type] = p.value;
  }
  const day = parts.day || '';
  const month = parts.month || '';
  const year = parts.year || '';
  return {
    iso: d.toISOString(),
    day,
    month,
    year,
    monthYear: capitalize(`${month} ${year}`),
    long: `${day} ${month} ${year}`,
  };
}

