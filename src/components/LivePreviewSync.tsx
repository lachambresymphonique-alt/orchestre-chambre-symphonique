'use client';

import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';

/**
 * Active le lien entre l'aperçu et l'admin sur une page rendue côté serveur :
 * cliquer une section marquée `data-live-field="<champ>"` fait défiler le
 * formulaire jusqu'à ce champ, et l'inverse fonctionne aussi.
 *
 * Les pages écrites en composant client appellent directement le hook
 * `useLivePreviewSync` ; celles rendues côté serveur posent ce composant, qui
 * n'affiche rien. Sans aperçu ouvert, il ne fait rien du tout.
 */
export function LivePreviewSync() {
  useLivePreviewSync(null);
  return null;
}

export default LivePreviewSync;
