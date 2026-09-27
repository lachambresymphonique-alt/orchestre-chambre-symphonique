import type { Block } from 'payload';
import { richTextAdmin } from '@/lib/richTextAdmin';
import { SECTION_LABEL, eyebrowField, imageField, linkGroup, sectionFields, titleField, variantField } from './settings';

/** Colonnes : 2 à 4 blocs côte à côte (sur téléphone, l'un sous l'autre). */
export const ColumnsSection: Block = {
  slug: 'columns',
  labels: { singular: 'Colonnes', plural: 'Colonnes' },
  imageURL: '/vignettes-sections/colonnes.svg',
  imageAltText: 'Trois cartes côte à côte',
  admin: { group: 'Texte', disableBlockName: true, components: { Label: SECTION_LABEL } },
  fields: sectionFields(
    [
      eyebrowField,
      titleField(),
      {
        name: 'items',
        type: 'array',
        label: 'Colonnes',
        labels: { singular: 'une colonne', plural: 'Colonnes' },
        minRows: 2,
        maxRows: 4,
        admin: { description: 'De 2 à 4. Sur téléphone, elles s’affichent l’une sous l’autre.' },
        fields: [
          { name: 'title', type: 'text', label: 'Titre', required: true },
          { name: 'text', type: 'textarea', label: 'Texte', admin: { ...richTextAdmin('inline') } },
          imageField('image', 'Image (facultative)'),
          linkGroup('link', 'Lien (facultatif)'),
        ],
      },
    ],
    [
      variantField(
        [
          { label: 'Cartes', value: 'cards' },
          { label: 'Sobre (séparées par des filets)', value: 'plain' },
        ],
        'cards',
      ),
    ],
  ),
};
