import type { CollectionConfig } from 'payload';

export const SupportTiers: CollectionConfig = {
  slug: 'support-tiers',
  admin: { useAsTitle: 'name' },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nom du cercle' },
    { name: 'minAmount', type: 'number', required: true, label: 'Montant minimum (€/an)' },
    { name: 'description', type: 'textarea', required: true, label: 'Description des avantages' },
    { name: 'ctaText', type: 'text', required: true, label: 'Texte du bouton', defaultValue: 'Rejoindre' },
    { name: 'ctaLink', type: 'text', label: 'Lien du bouton' },
    {
      name: 'highlighted',
      type: 'checkbox',
      label: 'Mis en avant',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
};
