/**
 * Images servies telles quelles, sans passer par l'optimisation de Vercel.
 *
 * Chaque variante optimisée (image × largeur) compte dans le quota de
 * transformations du compte Vercel. Un SVG ne s'optimise pas, et une image de
 * moins de 50 Ko n'y gagne presque rien : on l'envoie directement, avec
 * `unoptimized` sur le composant Image.
 */

export const SMALL_IMAGE_BYTES = 50 * 1024;

type MediaFile = { url?: string | null; filesize?: number | null; mimeType?: string | null };
type MediaDoc = MediaFile & { sizes?: Record<string, MediaFile | null | undefined> | null };

/**
 * Vrai quand l'image affichée est un SVG ou pèse moins de 50 Ko. `size` : le
 * format Payload réellement affiché (« card »…), quand ce n'est pas l'original.
 */
export function skipOptimization(media: unknown, size?: string): boolean {
  if (!media || typeof media !== 'object') return false;
  const doc = media as MediaDoc;
  const sized = size ? doc.sizes?.[size] : undefined;
  const file = sized?.url ? sized : doc;
  if ((file.mimeType || doc.mimeType) === 'image/svg+xml') return true;
  return typeof file.filesize === 'number' && file.filesize > 0 && file.filesize < SMALL_IMAGE_BYTES;
}
