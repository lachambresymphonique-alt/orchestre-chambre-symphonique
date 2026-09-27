import type { Block } from 'payload';
import { SECTION_LABEL, eyebrowField, imageField, sectionFields, titleField, variantField } from './settings';

/** Photos : de 1 à 12, agrandies au clic. Pas de carrousel. */
export const GallerySection: Block = {
  slug: 'gallery',
  labels: { singular: 'Photos', plural: 'Photos' },
  imageURL: '/vignettes-sections/photos.svg',
  imageAltText: 'Une mosaïque de photos',
  admin: { group: 'Images et vidéos', disableBlockName: true, components: { Label: SECTION_LABEL } },
  fields: sectionFields(
    [
      eyebrowField,
      titleField(),
      {
        name: 'images',
        type: 'array',
        label: 'Photos',
        labels: { singular: 'une photo', plural: 'Photos' },
        minRows: 1,
        maxRows: 12,
        fields: [
          imageField('image', 'Photo', true),
          { name: 'caption', type: 'text', label: 'Légende (facultative)' },
        ],
      },
    ],
    [
      variantField(
        [
          { label: 'Mosaïque (la première en grand)', value: 'mosaic' },
          { label: 'Grille régulière', value: 'grid' },
        ],
        'mosaic',
      ),
    ],
  ),
};
