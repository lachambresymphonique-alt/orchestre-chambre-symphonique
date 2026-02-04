import type { CollectionConfig } from 'payload';

export const MediaItems: CollectionConfig = {
  slug: 'media-items',
  admin: { useAsTitle: 'title' },
  defaultSort: 'order',
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      label: 'Type',
      options: [
        { label: 'Vidéo', value: 'video' },
        { label: 'Audio', value: 'audio' },
        { label: 'Photo', value: 'photo' },
      ],
    },
    { name: 'title', type: 'text', required: true, label: 'Titre' },
    { name: 'description', type: 'textarea', label: 'Description' },
    { name: 'date', type: 'text', label: 'Date / Période' },
    { name: 'thumbnail', type: 'upload', relationTo: 'media', label: 'Miniature' },
    { name: 'url', type: 'text', label: 'URL' },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
};
