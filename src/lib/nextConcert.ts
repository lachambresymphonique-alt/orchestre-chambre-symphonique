/**
 * Le prochain concert, en version courte, pour le menu mobile (en-tête de
 * toutes les pages). Requête légère : depth 0 et seulement les champs utiles,
 * puisqu'elle accompagne le rendu de chaque page.
 */
import { startOfKeyIso, shiftKey, todayKey, toConcertCard, type ConcertCard, type ConcertDoc } from './concerts';
import { bookable } from './concertSeo';

export type NextConcertTeaser = {
  title: string;
  /** Page du concert, sinon la liste des concerts. */
  href: string;
  /** « 31 » */
  day: string;
  /** « octobre » */
  month: string;
  /** Ville (ou salle) de cette représentation-là. */
  where: string;
  cancelled: boolean;
  /**
   * « Billets » de l'en-tête : les dates et la billetterie du prochain concert
   * maintenu, de préférence un dont la billetterie est ouverte. `null` s'il
   * n'y a rien à réserver (le bouton ne s'affiche pas).
   */
  ticketsHref: string | null;
};

type PayloadLike = {
  find: (args: Record<string, unknown>) => Promise<{ docs: unknown[] }>;
};

export async function findNextConcertTeaser(payload: PayloadLike): Promise<NextConcertTeaser | null> {
  const now = new Date();
  // Même fenêtre que findUpcomingConcerts : un jour de marge, puis le tri
  // exact sur le jour de Paris se fait dans toConcertCard.
  const from = startOfKeyIso(shiftKey(todayKey(now), -1));
  const res = await payload.find({
    collection: 'concerts',
    where: {
      and: [
        {
          or: [
            { lastDate: { greater_than_equal: from } },
            { and: [{ lastDate: { exists: false } }, { date: { greater_than_equal: from } }] },
          ],
        },
        { status: { not_equals: 'draft' } },
      ],
    },
    sort: 'date',
    limit: 10,
    depth: 0,
    select: { title: true, slug: true, performances: true, date: true, time: true, venue: true, status: true },
  });

  const upcoming = (res.docs as ConcertDoc[])
    .map((doc) => toConcertCard(doc, now))
    .filter((c): c is ConcertCard => c !== null && c.performances.length > 0)
    .sort((a, b) => a.date.key.localeCompare(b.date.key));
  const next = upcoming[0];
  if (!next) return null;

  const maintained = upcoming.filter((c) => c.status !== 'cancelled');
  const forTickets =
    maintained.find((c) => c.performances.some((p) => bookable(p.bookingLink))) ?? maintained[0] ?? null;

  return {
    title: next.title,
    href: next.url || '/concerts',
    day: next.date.day,
    month: next.date.month,
    where: next.performances[0].city || next.performances[0].venue,
    cancelled: next.status === 'cancelled',
    ticketsHref: forTickets ? `${forTickets.url || '/concerts'}#concert-dates` : null,
  };
}
