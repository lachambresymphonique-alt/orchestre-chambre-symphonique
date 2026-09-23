/**
 * Image de partage par défaut d’un article sans image de couverture.
 * Voir ../opengraph-image.tsx pour la raison de ce fichier.
 */
import OpengraphImage, {
  alt as siteAlt,
  contentType as siteContentType,
  size as siteSize,
} from '../../opengraph-image';

export const alt = siteAlt;
export const size = siteSize;
export const contentType = siteContentType;

export default OpengraphImage;
