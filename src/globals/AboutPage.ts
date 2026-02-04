import type { GlobalConfig } from 'payload'

export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: 'Page À propos',
  fields: [
    {
      name: 'intro',
      type: 'group',
      label: 'Introduction',
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
          name: 'content',
          type: 'textarea',
          label: 'Texte',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'stats',
      type: 'array',
      label: 'Chiffres clés',
      maxRows: 6,
      fields: [
        {
          name: 'number',
          type: 'text',
          required: true,
          label: 'Chiffre',
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Libellé',
        },
      ],
    },
  ],
}
