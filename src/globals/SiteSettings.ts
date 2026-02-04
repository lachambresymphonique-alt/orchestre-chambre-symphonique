import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Paramètres du site',
  fields: [
    {
      name: 'contact',
      type: 'group',
      label: 'Coordonnées',
      fields: [
        {
          name: 'address',
          type: 'textarea',
          label: 'Adresse',
        },
        {
          name: 'email',
          type: 'email',
          label: 'E-mail',
        },
        {
          name: 'phone',
          type: 'text',
          label: 'Téléphone',
        },
      ],
    },
    {
      name: 'social',
      type: 'group',
      label: 'Réseaux sociaux',
      fields: [
        {
          name: 'facebook',
          type: 'text',
        },
        {
          name: 'instagram',
          type: 'text',
        },
        {
          name: 'youtube',
          type: 'text',
        },
        {
          name: 'linkedin',
          type: 'text',
        },
        {
          name: 'tiktok',
          type: 'text',
        },
      ],
    },
    {
      name: 'hours',
      type: 'array',
      label: "Horaires d'ouverture",
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Jour(s)',
        },
        {
          name: 'hours',
          type: 'text',
          required: true,
          label: 'Horaires',
        },
      ],
    },
    {
      name: 'footerDescription',
      type: 'textarea',
      label: 'Description pied de page',
    },
  ],
}
