/**
 * Référencement des concerts : données structurées schema.org (MusicEvent)
 * et textes par défaut (titre, description) de la page d'un concert.
 *
 * Google affiche les événements balisés dans un encadré dédié (date, lieu,
 * billetterie) pour des recherches comme « concert Beaune novembre ». Une
 * représentation = un événement : c'est la forme qu'il attend pour une série
 * de dates. Construit côté serveur, à partir des cartes de lib/concerts.ts.
 */
import {
  CONCERT_TIMEZONE,
  type ConcertCard,
  type ConcertDoc,
  type ConcertPerformanceView,
} from './concerts';
import { toPlainText } from './richText';

export const SITE_URL = 'https://www.lachambresymphonique.fr';
export const SITE_NAME = 'La Chambre Symphonique';

/** Adresse absolue (images du stockage déjà absolues, chemins du site relatifs). */
export const absoluteUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`);

/** Décalage horaire de Paris un jour donné : « +01:00 » en hiver, « +02:00 » en été. */
function parisOffset(key: string, hours: number, minutes: number): string {
  const probe = new Date(`${key}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`);
  const name =
    new Intl.DateTimeFormat('en-US', { timeZone: CONCERT_TIMEZONE, timeZoneName: 'longOffset' })
      .formatToParts(probe)
      .find((p) => p.type === 'timeZoneName')?.value || 'GMT+01:00';
  const m = name.match(/GMT([+-]\d{2}):?(\d{2})?/);
  return m ? `${m[1]}:${m[2] || '00'}` : '+01:00';
}

/**
 * Début d'une représentation au format ISO 8601 : avec l'heure et le fuseau
 * de Paris quand l'horaire est connu (« 2026-10-31T20:30:00+01:00 »), la date
 * seule sinon (« 2026-10-31 »), que Google accepte.
 */
export function performanceStart(p: ConcertPerformanceView): string {
  const m = p.date.time?.match(/^(\d{1,2})h(\d{2})$/);
  if (!m) return p.date.key;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return `${p.date.key}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00${parisOffset(p.date.key, h, min)}`;
}

/** Programme sur une ligne (« Beethoven · Mozart · Mendelssohn »). */
export const programLine = (program: string) =>
  program
    .split(/\n+/)
    .map((l) => l.trim().replace(/[,;]\s*$/, ''))
    .filter(Boolean)
    .join(' · ');

/** Villes des représentations, dans l'ordre, sans doublon (lieu à défaut de ville). */
export function citiesOf(performances: ConcertPerformanceView[]): string[] {
  const out: string[] = [];
  for (const p of performances) {
    const c = p.city || p.venue;
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

const cut = (s: string, max: number) => {
  if (s.length <= max) return s;
  const head = s.slice(0, max - 1);
  const at = head.lastIndexOf(' ');
  return `${(at > max * 0.6 ? head.slice(0, at) : head).replace(/[\s,;:·—-]+$/, '')}…`;
};

/** « 18 – 26 avril 2026 », « 31 octobre – 7 novembre 2026 », « 8 novembre 2026 ». */
export function periodOf(performances: ConcertPerformanceView[]): string {
  const first = performances[0]?.date;
  const last = performances[performances.length - 1]?.date;
  if (!first || !last) return '';
  if (first.key === last.key) return `${first.day} ${first.month} ${first.year}`;
  if (first.month === last.month && first.year === last.year) return `${first.day} – ${last.day} ${last.month} ${last.year}`;
  if (first.year === last.year) return `${first.day} ${first.month} – ${last.day} ${last.month} ${last.year}`;
  return `${first.day} ${first.month} ${first.year} – ${last.day} ${last.month} ${last.year}`;
}

/**
 * Titre de la page (onglet et résultat Google) : choisi dans l'admin, sinon
 * composé pour tenir dans les ~65 caractères qu'affiche Google, en gardant ce
 * qui distingue le concert (villes, période) : le titre est raccourci d'abord.
 */
export function concertMetaTitle(card: ConcertCard, meta?: ConcertDoc['meta']): string {
  const chosen = meta?.title?.trim();
  if (chosen) return chosen;
  const cities = citiesOf(card.allPerformances);
  const where = cities.length > 2 ? `${cities.slice(0, 2).join(', ')}…` : cities.join(', ');
  const period = periodOf(card.allPerformances);
  const detail = [where, period].filter(Boolean).join(' · ');
  if (!detail) return cut(card.title, 65);
  return `${cut(card.title, Math.max(28, 65 - detail.length - 3))} — ${detail}`;
}

/** Description (résultat Google, partage) : choisie dans l'admin, sinon composée, ~160 caractères. */
export function concertMetaDescription(card: ConcertCard, meta?: ConcertDoc['meta']): string {
  const chosen = meta?.description?.trim();
  if (chosen) return chosen;
  const where = citiesOf(card.allPerformances).join(', ');
  const period = periodOf(card.allPerformances);
  // Lieu et date d'abord : c'est ce que Google coupe en dernier.
  const head = [where, period].filter(Boolean).join(' · ');
  const tail =
    card.status === 'cancelled'
      ? 'Concert annulé.'
      : card.performances.some((p) => bookable(p.bookingLink))
        ? 'Réservation en ligne.'
        : '';
  const program = card.program ? programLine(card.program) : '';
  const soloists = card.soloists.map((s) => s.name).filter((n) => n && !program.includes(n));
  const body = `${SITE_NAME}${soloists.length ? ` avec ${soloists.join(', ')}` : ''}${program ? ` : ${program}` : ''}.`;
  const budget = 158 - (head ? head.length + 3 : 0) - (tail ? tail.length + 1 : 0);
  return [head && `${head}.`, cut(body, Math.max(40, budget)), tail].filter(Boolean).join(' ');
}

/** Lien de billetterie réel : une page précise, pas l'accueil d'un site (« https://helloasso.fr »). */
export function bookable(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return /^https?:$/.test(u.protocol) && u.pathname.replace(/\/+$/, '') !== '';
  } catch {
    return false;
  }
}

const ORCHESTRA = { '@type': 'MusicGroup', name: SITE_NAME, url: SITE_URL } as const;

/**
 * Un MusicEvent par représentation. `url` : la page du concert (ou l'accueil
 * tant qu'il n'en a pas). Les représentations passées sont gardées : Google
 * les ignore, et la page d'archive reste décrite.
 */
export function concertEvents(card: ConcertCard): Record<string, unknown>[] {
  const url = absoluteUrl(card.url || '/#concerts');
  const image = card.image ? [absoluteUrl(card.image.url)] : undefined;
  const description = card.description ? cut(toPlainText(card.description), 300) : card.program ? programLine(card.program) : undefined;
  const performers = [
    ORCHESTRA,
    ...card.soloists.map((s) => ({
      '@type': 'Person',
      name: s.name,
      url: absoluteUrl(s.href),
      ...(s.instrument ? { description: s.instrument } : {}),
    })),
  ];
  const cancelled = card.status === 'cancelled';

  return card.allPerformances.map((p) => ({
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: card.title,
    url,
    startDate: performanceStart(p),
    eventStatus: cancelled ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: p.venue || p.city || 'Lieu à préciser',
      address: {
        '@type': 'PostalAddress',
        addressLocality: p.city || p.venue || undefined,
        addressCountry: 'FR',
      },
    },
    ...(image ? { image } : {}),
    ...(description ? { description } : {}),
    performer: performers,
    organizer: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    // Billetterie : seulement pour une date à venir d'un concert maintenu.
    ...(p.bookingLink && bookable(p.bookingLink) && !cancelled && !p.date.isPast
      ? {
          offers: {
            '@type': 'Offer',
            url: p.bookingLink,
            availability: 'https://schema.org/InStock',
            priceCurrency: 'EUR',
          },
        }
      : {}),
  }));
}

/** Fil d'Ariane de la page du concert (Accueil › Concerts › titre). */
export function concertBreadcrumb(card: ConcertCard): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Concerts', item: `${SITE_URL}/concerts` },
      ...(card.url ? [{ '@type': 'ListItem', position: 3, name: card.title, item: absoluteUrl(card.url) }] : []),
    ],
  };
}

/** JSON sûr dans un <script> : « </script> » dans un texte ne peut pas fermer la balise. */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
