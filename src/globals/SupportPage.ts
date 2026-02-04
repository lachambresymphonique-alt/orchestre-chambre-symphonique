import type { GlobalConfig } from 'payload'

export const SupportPage: GlobalConfig = {
  slug: 'support-page',
  label: 'Page Nous soutenir',
  fields: [
    {
      name: 'supportTypes',
      type: 'array',
      label: 'Formes de soutien',
      maxRows: 4,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
        },
        {
          name: 'ctaText',
          type: 'text',
          required: true,
        },
        {
          name: 'ctaLink',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'taxInfo',
      type: 'group',
      label: 'Avantage fiscal',
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
        {
          name: 'individualRate',
          type: 'text',
          label: 'Taux particuliers',
          defaultValue: '66%',
        },
        {
          name: 'corporateRate',
          type: 'text',
          label: 'Taux entreprises',
          defaultValue: '60%',
        },
        {
          name: 'example',
          type: 'text',
          label: 'Exemple',
        },
      ],
    },
  ],
}
