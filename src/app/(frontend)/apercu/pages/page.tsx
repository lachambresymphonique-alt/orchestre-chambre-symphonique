import type { Metadata } from 'next';
import { PagePreview } from '@/components/PagePreview';

/**
 * Aperçu en direct des pages libres, ouvert par le bouton « œil » de l'admin
 * (Pages → une page). Le contenu arrive de l'admin : voir PagePreview.
 */
export const metadata: Metadata = {
  title: 'Aperçu — page',
  robots: { index: false, follow: false },
};

export default function PagePreviewRoute() {
  return <PagePreview />;
}
