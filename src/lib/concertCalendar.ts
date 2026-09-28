/**
 * Gestes du téléphone autour d'une représentation : ouvrir l'itinéraire vers
 * la salle, ajouter la date à son agenda (fichier .ics).
 *
 * Module pur : utilisé par les pages concert (client) et par la route
 * /concerts/<slug>/agenda (serveur).
 */
import type { ConcertCard, ConcertPerformanceView } from './concerts';
import { absoluteUrl, performanceStart, programLine } from './concertSeo';

/**
 * Recherche du lieu dans Google Maps : l'adresse universelle, qui ouvre
 * l'application de cartes sur Android comme sur iPhone, ou le site ailleurs.
 */
export function mapsUrl(place: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
}

/** Fichier d'agenda d'une représentation (toutes les dates à venir sans `id`). */
export function calendarPath(concertUrl: string, performanceId?: string): string {
  return `${concertUrl}/agenda${performanceId ? `?representation=${encodeURIComponent(performanceId)}` : ''}`;
}

/** Durée supposée d'un concert, faute de mieux : deux heures. */
const DURATION_MS = 2 * 60 * 60 * 1000;

/** Texte d'une propriété iCalendar : \ ; , et retours à la ligne échappés (RFC 5545 §3.3.11). */
function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

const encoder = new TextEncoder();

/** Lignes de 75 octets au plus, les suivantes commencent par une espace (§3.1). */
function fold(line: string): string {
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > (out.length === 0 ? 75 : 74)) {
      out.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  out.push(current);
  return out.join('\r\n ');
}

/** « 20261031T193000Z » */
const utcStamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** « 20261031 » */
const dateStamp = (key: string) => key.replace(/-/g, '');

function nextDayKey(key: string): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function eventLines(card: ConcertCard, p: ConcertPerformanceView, now: Date): string[] {
  const start = performanceStart(p);
  // Horaire inconnu : un événement sur la journée entière.
  const when = start.includes('T')
    ? [`DTSTART:${utcStamp(new Date(start))}`, `DTEND:${utcStamp(new Date(new Date(start).getTime() + DURATION_MS))}`]
    : [`DTSTART;VALUE=DATE:${dateStamp(p.date.key)}`, `DTEND;VALUE=DATE:${dateStamp(nextDayKey(p.date.key))}`];
  const url = card.url ? absoluteUrl(card.url) : null;
  const details = [card.program ? programLine(card.program) : '', url || ''].filter(Boolean).join('\n\n');
  const cancelled = card.status === 'cancelled';

  return [
    'BEGIN:VEVENT',
    `UID:concert-${card.id}-${p.id}@lachambresymphonique.fr`,
    `DTSTAMP:${utcStamp(now)}`,
    ...when,
    `SUMMARY:${escapeText(`${cancelled ? 'Annulé : ' : ''}${card.title} · La Chambre Symphonique`)}`,
    ...(p.place ? [`LOCATION:${escapeText(p.place)}`] : []),
    ...(details ? [`DESCRIPTION:${escapeText(details)}`] : []),
    ...(url ? [`URL:${url}`] : []),
    `STATUS:${cancelled ? 'CANCELLED' : 'CONFIRMED'}`,
    'END:VEVENT',
  ];
}

/** Calendrier iCalendar des représentations données, prêt à servir. */
export function buildConcertCalendar(
  card: ConcertCard,
  performances: ConcertPerformanceView[],
  now: Date = new Date(),
): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//La Chambre Symphonique//Concerts//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...performances.flatMap((p) => eventLines(card, p, now)),
    'END:VCALENDAR',
  ];
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
