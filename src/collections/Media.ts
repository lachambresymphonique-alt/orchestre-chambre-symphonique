import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 512, position: 'centre' },
    ],
  },
  admin: { useAsTitle: 'alt' },
  fields: [{ name: 'alt', type: 'text', required: true, label: 'Texte alternatif' }],
};
