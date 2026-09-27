import type { Block } from 'payload';
import { richTextAdmin } from '@/lib/richTextAdmin';
import { parseVideoUrl } from '@/lib/video';
import { SECTION_LABEL, eyebrowField, imageField, sectionFields, titleField } from './settings';

/** Vidéo YouTube ou Vimeo, chargée seulement au clic. */
export const VideoSection: Block = {
  slug: 'video',
  labels: { singular: 'Vidéo', plural: 'Vidéos' },
  imageURL: '/vignettes-sections/video.svg',
  imageAltText: 'Une vidéo en grand',
  admin: { group: 'Images et vidéos', disableBlockName: true, components: { Label: SECTION_LABEL } },
  fields: sectionFields([
    {
      name: 'url',
      type: 'text',
      label: 'Lien de la vidéo',
      required: true,
      validate: (value: unknown) => {
        if (typeof value !== 'string' || value.trim() === '') return 'Collez le lien YouTube ou Vimeo de la vidéo.';
        return parseVideoUrl(value) ? true : 'Ce lien n’est pas reconnu : collez l’adresse d’une vidéo YouTube ou Vimeo.';
      },
      admin: { placeholder: 'https://www.youtube.com/watch?v=…' },
    },
    eyebrowField,
    titleField(),
    { name: 'caption', type: 'textarea', label: 'Légende (facultative)', admin: { ...richTextAdmin('inline') } },
    imageField('poster', 'Image d’aperçu (facultative, sinon celle de YouTube/Vimeo)'),
  ]),
};
