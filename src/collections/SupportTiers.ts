import type { CollectionConfig } from 'payload';

export const SupportTiers: CollectionConfig = {
  slug: 'support-tiers',
  labels: { singular: 'Cercle de soutien', plural: 'Cercles de soutien' },
  admin: {
    useAsTitle: 'name',
    group: 'Contenu',
    description: 'Formules d\'adhésion et de soutien affichées sur la page Nous soutenir.',
    defaultColumns: ['name', 'minAmount', 'highlighted'],
  },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nom du cercle' },
    {
      name: 'minAmount',
      type: 'number',
      required: true,
      label: 'Montant minimum (€/an)',
      admin: { description: 'Montant à partir duquel on peut rejoindre ce cercle.' },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      label: 'Avantages',
      admin: { description: 'Liste des avantages pour les membres de ce cercle.' },
    },
    {
      name: 'ctaText',
      type: 'text',
      required: true,
      label: 'Texte du bouton',
      defaultValue: 'Rejoindre',
    },
    {
      name: 'ctaLink',
      type: 'text',
      label: 'Lien du bouton',
      admin: { description: 'URL vers HelloAsso ou autre plateforme de paiement.' },
    },
    {
      name: 'highlighted',
      type: 'checkbox',
      label: 'Mis en avant',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Cocher pour mettre ce cercle en évidence sur le site.',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'Ordre d\'affichage',
      admin: { position: 'sidebar', description: 'Plus petit = affiché en premier.' },
    },
  ],
};
