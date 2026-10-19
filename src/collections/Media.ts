import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Images' },
  access: {
    read: () => true,
  },
  upload: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    // L'original est ramené à 1920 px de large à l'envoi (format conservé, SVG
    // non concernés) : c'est la plus grande largeur que le site demande, et
    // chaque transformation de Vercel relit l'original entier (une affiche de
    // 14 Mo à chaque fois). `withoutEnlargement` : une petite image, ou un
    // recadrage fait dans l'admin, n'est jamais agrandie.
    resizeOptions: { width: 1920, withoutEnlargement: true },
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 512, position: 'centre' },
    ],
  },
  admin: {
    useAsTitle: 'alt',
    group: 'Bibliothèque d’images',
    description: 'Toutes les photos, logos et illustrations utilisés sur le site. Vous pouvez les téléverser ici puis les sélectionner depuis n’importe quelle page.',
    // La colonne « nom du fichier » porte la vignette de l'image : en la
    // mettant en tête, la liste se parcourt à l'œil plutôt qu'au texte.
    defaultColumns: ['filename', 'alt', 'updatedAt'],
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
