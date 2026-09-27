import type { Block } from 'payload';
import { richTextAdmin } from '@/lib/richTextAdmin';
import { SECTION_LABEL, imageField, sectionFields, variantField } from './settings';

/** Citation : faire entendre une voix (le chef, la presse, un musicien, le public). */
export const QuoteSection: Block = {
  slug: 'quote',
  labels: { singular: 'Citation', plural: 'Citations' },
  imageURL: '/vignettes-sections/citation.svg',
  imageAltText: 'Une citation en grand, avec son auteur',
  admin: { group: 'Texte', disableBlockName: true, components: { Label: SECTION_LABEL } },
  fields: sectionFields(
    [
      {
        name: 'quote',
        type: 'textarea',
        label: 'Citation',
        required: true,
        admin: { ...richTextAdmin('inline'), description: 'Sans guillemets : ils sont ajoutés à l’affichage.' },
      },
      {
        type: 'row',
        fields: [
          { name: 'author', type: 'text', label: 'Auteur', admin: { width: '50%' } },
          {
            name: 'role',
            type: 'text',
            label: 'Fonction ou source',
            admin: { width: '50%', placeholder: 'Ex : Le Journal de Saône-et-Loire, mars 2025' },
          },
        ],
      },
      imageField('photo', 'Photo de l’auteur (facultative)'),
    ],
    [
      variantField(
        [
          { label: 'Signature (bandeau, centrée)', value: 'signature' },
          { label: 'En marge (alignée à gauche)', value: 'margin' },
        ],
        'signature',
      ),
    ],
  ),
};
