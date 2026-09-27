import type { Block } from 'payload';
import { SECTION_LABEL, eyebrowField, sectionFields, titleField, variantField } from './settings';

/** Concerts : les prochaines dates (mises à jour seules) ou une sélection. */
export const ConcertsSection: Block = {
  slug: 'concerts',
  labels: { singular: 'Concerts', plural: 'Concerts' },
  imageURL: '/vignettes-sections/concerts.svg',
  imageAltText: 'Des affiches de concerts côte à côte',
  admin: { group: 'L’orchestre', disableBlockName: true, components: { Label: SECTION_LABEL } },
  fields: sectionFields(
    [
      eyebrowField,
      titleField(),
      {
        name: 'source',
        type: 'radio',
        label: 'Quels concerts ?',
        defaultValue: 'upcoming',
        options: [
          { label: 'Les prochains concerts (mis à jour seuls)', value: 'upcoming' },
          { label: 'Une sélection', value: 'selected' },
        ],
      },
      {
        name: 'concerts',
        type: 'relationship',
        relationTo: 'concerts',
        hasMany: true,
        label: 'Concerts choisis',
        admin: { condition: (_, siblingData) => siblingData?.source === 'selected' },
      },
      {
        name: 'limit',
        type: 'number',
        label: 'Nombre maximum',
        defaultValue: 6,
        min: 1,
        max: 12,
        admin: { condition: (_, siblingData) => siblingData?.source !== 'selected', step: 1 },
      },
    ],
    [
      variantField(
        [
          { label: 'Affiches', value: 'posters' },
          { label: 'Bande défilante', value: 'strip' },
        ],
        'posters',
      ),
    ],
  ),
};
