import type { CollectionConfig } from 'payload';

export const Musicians: CollectionConfig = {
  slug: 'musicians',
  admin: { useAsTitle: 'name' },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nom' },
    { name: 'role', type: 'text', required: true, label: 'Rôle' },
    { name: 'instrument', type: 'text', label: 'Instrument' },
    {
      name: 'section',
      type: 'select',
      required: true,
      label: 'Section',
      options: [
        { label: 'Direction artistique', value: 'direction' },
        { label: 'Cordes', value: 'cordes' },
        { label: 'Vents', value: 'vents' },
        { label: 'Claviers & Percussions', value: 'claviers' },
      ],
    },
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Photo' },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
};
