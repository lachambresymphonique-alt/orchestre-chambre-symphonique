import type { CollectionConfig } from 'payload';

export const MediaItems: CollectionConfig = {
  slug: 'media-items',
  labels: { singular: 'Média', plural: 'Médias' },
  admin: {
    useAsTitle: 'title',
    group: 'Médiathèque',
    description: 'Vidéos, extraits audio et photos affichés sur la page Médias.',
    defaultColumns: ['title', 'type', 'date'],
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      label: 'Type de média',
      options: [
        { label: 'Vidéo', value: 'video' },
        { label: 'Audio', value: 'audio' },
        { label: 'Photo', value: 'photo' },
      ],
    },
    { name: 'title', type: 'text', required: true, label: 'Titre' },
    { name: 'description', type: 'textarea', label: 'Description' },
    {
      name: 'date',
      type: 'text',
      label: 'Date / Période',
      admin: { description: 'Ex : « Mars 2024 » ou « Saison 2023-2024 »' },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      label: 'Miniature',
      admin: { description: 'Image d\'aperçu affichée dans la galerie.' },
    },
    {
      name: 'url',
      type: 'text',
      label: 'Lien',
      admin: { description: 'URL YouTube, SoundCloud ou lien vers la photo en haute résolution.' },
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
