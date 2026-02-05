import type { CollectionConfig } from 'payload';

export const TimelineEvents: CollectionConfig = {
  slug: 'timeline-events',
  labels: { singular: 'Événement', plural: 'Chronologie' },
  admin: {
    useAsTitle: 'year',
    group: 'Contenu',
    description: 'Dates clés affichées sur la frise chronologique de la page À propos.',
    defaultColumns: ['year', 'description'],
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'year',
      type: 'text',
      required: true,
      label: 'Année',
      admin: { description: 'Ex : « 2017 » ou « 2020-2021 »' },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      label: 'Description',
      admin: { description: 'Ce qui s\'est passé cette année-là.' },
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
