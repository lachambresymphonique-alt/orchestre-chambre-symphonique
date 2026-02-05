import type { CollectionConfig } from 'payload';

export const Concerts: CollectionConfig = {
  slug: 'concerts',
  labels: { singular: 'Concert', plural: 'Concerts' },
  admin: {
    useAsTitle: 'title',
    group: 'Contenu',
    description: 'Programmation des concerts à venir et passés.',
    defaultColumns: ['title', 'day', 'monthYear', 'venue'],
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'day',
      type: 'text',
      required: true,
      label: 'Jour',
      admin: { description: 'Ex : « 15 » ou « 22-23 »', width: '25%' },
    },
    {
      name: 'monthYear',
      type: 'text',
      required: true,
      label: 'Mois et année',
      admin: { description: 'Ex : « Juin 2025 »', width: '25%' },
    },
    { name: 'title', type: 'text', required: true, label: 'Titre du concert' },
    {
      name: 'venue',
      type: 'text',
      required: true,
      label: 'Lieu',
      admin: { description: 'Nom de la salle ou du lieu.' },
    },
    {
      name: 'program',
      type: 'textarea',
      required: true,
      label: 'Programme',
      admin: { description: 'Œuvres et compositeurs interprétés.' },
    },
    {
      name: 'bookingLink',
      type: 'text',
      label: 'Lien de réservation',
      admin: { description: 'URL vers la billetterie (ex : HelloAsso). Laisser vide si pas de réservation.' },
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
