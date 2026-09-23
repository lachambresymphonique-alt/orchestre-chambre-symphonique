'use client';

import { useLiveDoc } from '@/hooks/useLiveDocument';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { MusicianDetail, type Musician, type MusicianDetailLabels } from '@/components/MusicianDetail';

/**
 * Fiche musicien rendue avec l'aperçu en direct de l'admin : chaque frappe dans
 * le formulaire se reflète aussitôt, sans attendre « Sauvegarder ». Hors de
 * l'aperçu, la fiche reçue du serveur est rendue telle quelle.
 * Branche aussi le lien aperçu → champ (`data-live-field`).
 */
export function MusicianDetailLive({
  musician,
  labels,
}: {
  musician: Musician;
  labels?: MusicianDetailLabels | null;
}) {
  const data = useLiveDoc<Musician>('musicians', musician, 1);
  useLivePreviewSync(data);

  return <MusicianDetail musician={data} labels={labels} />;
}
