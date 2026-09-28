import type { Block } from 'payload';
import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import { SECTION_LABEL, eyebrowField, lexicalParagraph, sectionFields, titleField, variantField } from './settings';

/**
 * Texte : paragraphes, intertitres, listes, liens et images. L'éditeur garde
 * toutes les fonctions par défaut (celles de l'ancien champ « Contenu ») pour
 * relire sans perte les pages existantes, avec une barre d'outils visible.
 */
export const TextSection: Block = {
  slug: 'text',
  labels: { singular: 'Texte', plural: 'Textes' },
  imageURL: '/vignettes-sections/texte.svg',
  imageAltText: 'Une colonne de texte',
  admin: { group: 'Texte', disableBlockName: true, components: { Label: SECTION_LABEL } },
  fields: sectionFields(
    [
      eyebrowField,
      titleField(false, 'Un titre pour *cette section*'),
      {
        name: 'content',
        type: 'richText',
        label: 'Texte',
        defaultValue: lexicalParagraph(
          'Écrivez ici votre texte. Sélectionnez un mot pour le mettre en gras ou en italique ; la barre d’outils ajoute des intertitres, des listes, des liens et des images.',
        ),
        editor: lexicalEditor({
          features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
        }),
      },
    ],
    [
      variantField(
        [
          { label: 'Colonne de lecture', value: 'plain' },
          { label: 'Premier paragraphe en exergue', value: 'lead' },
        ],
        'plain',
      ),
    ],
  ),
};
