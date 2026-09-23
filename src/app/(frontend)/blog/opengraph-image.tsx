/**
 * Image de partage par défaut pour la page /blog.
 *
 * Quand une page définit son propre bloc `openGraph` (sans `images`),
 * Next.js n’hérite pas de l’image du layout : ce fichier ré-applique
 * l’image du site au niveau de ce segment. Un article avec image de
 * couverture définit `images` lui-même et n’est pas concerné.
 *
 * Exports explicites (pas de `export … from`) : le chargeur de routes
 * métadonnées de Next.js lit ces constantes par analyse statique.
 */
import OpengraphImage, {
  alt as siteAlt,
  contentType as siteContentType,
  size as siteSize,
} from '../opengraph-image';

export const alt = siteAlt;
export const size = siteSize;
export const contentType = siteContentType;

export default OpengraphImage;
