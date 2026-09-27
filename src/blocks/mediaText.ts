import type { Block } from 'payload';
import { richTextAdmin } from '@/lib/richTextAdmin';
import { SECTION_LABEL, eyebrowField, imageField, linkGroup, sectionFields, titleField, variantField } from './settings';

/** Texte + image : le geste de base du site, une photo et un texte côte à côte. */
export const MediaTextSection: Block = {
  slug: 'mediaText',
  labels: { singular: 'Texte + image', plural: 'Textes + images' },
  imageURL: '/vignettes-sections/texte-image.svg',
  imageAltText: 'Une photo et un texte côte à côte',
  admin: { group: 'Images et vidéos', disableBlockName: true, components: { Label: SECTION_LABEL } },
  fields: sectionFields(
    [
      imageField('image', 'Photo', true),
      eyebrowField,
      titleField(),
      { name: 'text', type: 'textarea', label: 'Texte', admin: { ...richTextAdmin('prose') } },
      linkGroup('link', 'Lien (facultatif)'),
    ],
    [
      variantField(
        [
          { label: 'Photo à gauche', value: 'imageLeft' },
          { label: 'Photo à droite', value: 'imageRight' },
        ],
        'imageLeft',
      ),
    ],
  ),
};
