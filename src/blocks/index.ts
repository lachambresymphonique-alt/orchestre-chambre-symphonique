import type { Block } from 'payload';
import { TextSection } from './text';

/**
 * Types de sections des pages libres (champ `layout` de Pages).
 *
 * Stockées en JSON (`blocksAsJSON` dans payload.config.ts) : ajouter un type
 * ou un champ ne change pas le schéma de la base. En revanche, ne jamais
 * retirer un type ni renommer un champ déjà utilisé sans script de reprise :
 * l'admin n'affiche pas une section de type inconnu et la perdrait au
 * prochain enregistrement.
 */
export const PAGE_SECTIONS: Block[] = [TextSection];
