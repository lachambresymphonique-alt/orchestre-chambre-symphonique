import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Images' },
  access: {
    read: () => true,
  },
  upload: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 512, position: 'centre' },
    ],
  },
  admin: {
    useAsTitle: 'alt',
    group: 'Bibliothèque d’images',
    description: 'Toutes les photos, logos et illustrations utilisés sur le site. Vous pouvez les téléverser ici puis les sélectionner depuis n’importe quelle page.',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Texte alternatif',
      admin: {
        description: 'Description de l\'image pour l\'accessibilité et le référencement.',
      },
    },
  ],
};
