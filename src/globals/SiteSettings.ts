import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Paramètres du site',
  admin: {
    group: 'Configuration',
    description: 'Informations générales du site : coordonnées, réseaux sociaux, horaires.',
  },
  fields: [
    {
      name: 'contact',
      type: 'group',
      label: 'Coordonnées',
      admin: { description: 'Informations affichées sur la page Contact et dans le pied de page.' },
      fields: [
        {
          name: 'address',
          type: 'textarea',
          label: 'Adresse postale',
          admin: { description: 'Adresse complète de l\'association.' },
        },
        { name: 'email', type: 'email', label: 'Adresse e-mail' },
        {
          name: 'phone',
          type: 'text',
          label: 'Téléphone',
          admin: { description: 'Numéro avec indicatif (ex : +33 6 12 34 56 78).' },
        },
      ],
    },
    {
      name: 'social',
      type: 'group',
      label: 'Réseaux sociaux',
      admin: { description: 'Liens vers vos profils. Laisser vide pour masquer une icône.' },
      fields: [
        { name: 'facebook', type: 'text', label: 'Facebook', admin: { description: 'URL complète de la page Facebook.' } },
        { name: 'instagram', type: 'text', label: 'Instagram', admin: { description: 'URL du profil Instagram.' } },
        { name: 'youtube', type: 'text', label: 'YouTube', admin: { description: 'URL de la chaîne YouTube.' } },
        { name: 'linkedin', type: 'text', label: 'LinkedIn', admin: { description: 'URL de la page LinkedIn.' } },
        { name: 'tiktok', type: 'text', label: 'TikTok', admin: { description: 'URL du profil TikTok.' } },
      ],
    },
    {
      name: 'hours',
      type: 'array',
      label: 'Horaires d\'ouverture',
      admin: { description: 'Affichés sur la page Contact.' },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Jour(s)',
          admin: { description: 'Ex : « Lundi - Vendredi »' },
        },
        {
          name: 'hours',
          type: 'text',
          required: true,
          label: 'Horaires',
          admin: { description: 'Ex : « 9h00 - 18h00 »' },
        },
      ],
    },
    {
      name: 'footerDescription',
      type: 'textarea',
      label: 'Description du pied de page',
      admin: { description: 'Texte court affiché dans le footer du site, sous le logo.' },
    },
  ],
}
