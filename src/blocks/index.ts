import type { Block } from 'payload';
import { TextSection } from './text';
import { QuoteSection } from './quote';
import { MediaTextSection } from './mediaText';
import { ColumnsSection } from './columns';
import { GallerySection } from './gallery';
import { VideoSection } from './video';
import { CtaSection } from './cta';
import { ConcertsSection } from './concerts';

/**
 * Types de sections des pages libres (champ `layout` de Pages), dans l'ordre
 * du sélecteur « Ajouter une section ».
 *
 * Stockées en JSON (`blocksAsJSON` dans payload.config.ts) : ajouter un type
 * ou un champ ne change pas le schéma de la base. En revanche, ne jamais
 * retirer un type ni renommer un champ déjà utilisé sans script de reprise :
 * l'admin n'affiche pas une section de type inconnu et la perdrait au
 * prochain enregistrement. Rendu : src/components/sections/Sections.tsx.
 */
export const PAGE_SECTIONS: Block[] = [
  TextSection,
  QuoteSection,
  ColumnsSection,
  MediaTextSection,
  GallerySection,
  VideoSection,
  CtaSection,
  ConcertsSection,
];
