import type { CollectionConfig } from 'payload';

export const Partners: CollectionConfig = {
  slug: 'partners',
  admin: { useAsTitle: 'name' },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nom' },
    { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo' },
    { name: 'url', type: 'text', label: 'Site web' },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
};
