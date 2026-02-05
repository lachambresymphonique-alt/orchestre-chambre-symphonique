import type { GlobalConfig } from 'payload'

export const SupportPage: GlobalConfig = {
  slug: 'support-page',
  label: 'Page Nous soutenir',
  admin: {
    group: 'Pages',
    description: 'Contenu de la page Nous soutenir : formes de soutien et avantages fiscaux.',
  },
  fields: [
    {
      name: 'supportTypes',
      type: 'array',
      label: 'Formes de soutien',
      maxRows: 4,
      admin: { description: 'Les différentes façons de soutenir l\'orchestre (adhésion, don, bénévolat…). Maximum 4.' },
      fields: [
        { name: 'title', type: 'text', required: true, label: 'Titre', admin: { description: 'Ex : « Adhérer à l\'association »' } },
        { name: 'description', type: 'textarea', required: true, label: 'Description' },
        { name: 'ctaText', type: 'text', required: true, label: 'Texte du bouton', admin: { description: 'Ex : « Adhérer maintenant »' } },
        { name: 'ctaLink', type: 'text', required: true, label: 'Lien du bouton', admin: { description: 'URL vers la page d\'action (ex : HelloAsso).' } },
      ],
    },
    {
      name: 'taxInfo',
      type: 'group',
      label: 'Avantage fiscal',
      admin: { description: 'Informations sur la déductibilité fiscale des dons.' },
      fields: [
        { name: 'subtitle', type: 'text', label: 'Sur-titre' },
        { name: 'title', type: 'text', label: 'Titre' },
        { name: 'description', type: 'textarea', label: 'Description', admin: { description: 'Explication du dispositif fiscal.' } },
        {
          name: 'individualRate',
          type: 'text',
          label: 'Taux de réduction (particuliers)',
          defaultValue: '66%',
          admin: { description: 'Pourcentage de réduction d\'impôt pour les particuliers.' },
        },
        {
          name: 'corporateRate',
          type: 'text',
          label: 'Taux de réduction (entreprises)',
          defaultValue: '60%',
          admin: { description: 'Pourcentage de réduction d\'impôt pour les entreprises.' },
        },
        {
          name: 'example',
          type: 'text',
          label: 'Exemple concret',
          admin: { description: 'Ex : « Un don de 100€ ne vous coûte que 34€ après réduction »' },
        },
      ],
    },
  ],
}
