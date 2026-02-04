import type { CollectionConfig } from 'payload';

export const TimelineEvents: CollectionConfig = {
  slug: 'timeline-events',
  admin: { useAsTitle: 'year' },
  defaultSort: 'order',
  fields: [
    { name: 'year', type: 'text', required: true, label: 'Année' },
    { name: 'description', type: 'textarea', required: true, label: 'Description' },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
};
