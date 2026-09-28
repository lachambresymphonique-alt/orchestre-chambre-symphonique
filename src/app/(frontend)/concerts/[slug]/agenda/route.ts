import { getPayloadClient } from '@/lib/payload';
import { findConcertBySlug, toConcertCard } from '@/lib/concerts';
import { buildConcertCalendar } from '@/lib/concertCalendar';

/**
 * Fichier d'agenda (.ics) d'un concert : une représentation
 * (?representation=<id>) ou, sans paramètre, toutes celles à venir. Ouvert
 * depuis un téléphone, il propose d'ajouter la date au calendrier.
 * Brouillons exclus ; jamais indexé.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const payload = await getPayloadClient();
  const doc = await findConcertBySlug(payload as any, slug);
  const card = doc ? toConcertCard(doc) : null;
  if (!card) return new Response('Concert introuvable', { status: 404 });

  const wanted = new URL(request.url).searchParams.get('representation');
  const performances = wanted ? card.allPerformances.filter((p) => p.id === wanted) : card.performances;
  if (performances.length === 0) return new Response('Représentation introuvable', { status: 404 });

  return new Response(buildConcertCalendar(card, performances), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
