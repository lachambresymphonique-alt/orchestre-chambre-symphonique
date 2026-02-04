import type { CollectionConfig } from 'payload';

export const Concerts: CollectionConfig = {
  slug: 'concerts',
  admin: { useAsTitle: 'title' },
  defaultSort: 'order',
  fields: [
    { name: 'day', type: 'text', required: true, label: 'Jour' },
    { name: 'monthYear', type: 'text', required: true, label: 'Mois et année' },
    { name: 'title', type: 'text', required: true, label: 'Titre' },
    { name: 'venue', type: 'text', required: true, label: 'Lieu' },
    { name: 'program', type: 'text', required: true, label: 'Programme' },
    { name: 'bookingLink', type: 'text', label: 'Lien de réservation' },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: "Ordre d'affichage",
      admin: { position: 'sidebar' },
    },
  ],
};
