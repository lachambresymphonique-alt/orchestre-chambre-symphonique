import type { Block } from 'payload';

/**
 * Section « Texte » des pages : paragraphes, intertitres, listes, liens et
 * images, avec l'éditeur Lexical par défaut (le même que l'ancien champ
 * « Contenu », pour relire sans perte les pages existantes).
 */
export const TextSection: Block = {
  slug: 'text',
  labels: { singular: 'Texte', plural: 'Textes' },
  fields: [
    {
      name: 'content',
      type: 'richText',
      label: 'Texte',
    },
  ],
};
