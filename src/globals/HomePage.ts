import type { GlobalConfig } from 'payload'

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: "Page d'accueil",
  fields: [
    {
      name: 'hero',
      type: 'group',
      label: 'Héro',
      fields: [
        {
          name: 'subtitle',
          type: 'text',
        },
        {
          name: 'titleLine1',
          type: 'text',
        },
        {
          name: 'titleLine2Italic',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'ctaPrimaryText',
          type: 'text',
        },
        {
          name: 'ctaPrimaryLink',
          type: 'text',
        },
        {
          name: 'ctaSecondaryText',
          type: 'text',
        },
        {
          name: 'ctaSecondaryLink',
          type: 'text',
        },
      ],
    },
    {
      name: 'presentation',
      type: 'group',
      label: 'Présentation',
      fields: [
        {
          name: 'subtitle',
          type: 'text',
        },
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'paragraphs',
          type: 'textarea',
          label: 'Texte',
        },
        {
          name: 'ctaText',
          type: 'text',
        },
        {
          name: 'ctaLink',
          type: 'text',
        },
        {
          name: 'signature',
          type: 'text',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'newsletter',
      type: 'group',
      label: 'Newsletter',
      fields: [
        {
          name: 'subtitle',
          type: 'text',
        },
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
        },
      ],
    },
  ],
}
