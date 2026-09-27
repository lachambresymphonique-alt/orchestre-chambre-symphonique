import type { Metadata } from 'next';
import { PagePreview } from '@/components/PagePreview';
import { getPayloadClient } from '@/lib/payload';
import { findUpcomingConcerts, type ConcertCard } from '@/lib/concerts';

/**
 * Aperçu en direct des pages libres, ouvert par le bouton « œil » de l'admin
 * (Pages → une page). Le contenu arrive de l'admin : voir PagePreview.
 */
export const metadata: Metadata = {
  title: 'Aperçu — page',
  robots: { index: false, follow: false },
};

// Les prochains concerts, pour une section « Concerts » ajoutée pendant la
// saisie : chargés une fois ici, le reste arrive de l'admin.
export const dynamic = 'force-dynamic';

export default async function PagePreviewRoute() {
  let upcomingConcerts: ConcertCard[] = [];
  try {
    upcomingConcerts = await findUpcomingConcerts((await getPayloadClient()) as any, { limit: 12 });
  } catch {
    // Aperçu sans concerts plutôt que pas d'aperçu.
  }
  return <PagePreview upcomingConcerts={upcomingConcerts} />;
}
