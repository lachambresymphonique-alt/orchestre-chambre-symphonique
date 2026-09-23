'use client';

import { useLivePreview } from '@payloadcms/live-preview-react';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { MusicianDetail, type Musician, type MusicianDetailLabels } from '@/components/MusicianDetail';

/**
 * Fiche musicien rendue avec l'aperçu en direct de l'admin : chaque frappe dans
 * le formulaire se reflète aussitôt, sans attendre « Sauvegarder ». Hors de
 * l'aperçu, `useLivePreview` renvoie simplement la fiche reçue du serveur.
 * Branche aussi le lien aperçu → champ (`data-live-field`).
 */
export function MusicianDetailLive({
  musician,
  labels,
}: {
  musician: Musician;
  labels?: MusicianDetailLabels | null;
}) {
  const serverURL =
    typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || '';

  const { data } = useLivePreview<Musician>({ initialData: musician, serverURL, depth: 1 });
  useLivePreviewSync(data);

  return <MusicianDetail musician={data} labels={labels} />;
}
