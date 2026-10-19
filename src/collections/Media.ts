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
    description: 'Toutes les photos, logos et affiches du site. Ajoutez-en ici, une ou plusieurs à la fois, puis choisissez-les depuis n’importe quelle page.',
    // La première colonne montre l'image (MediaFileCell) : la liste se
    // parcourt à l'œil plutôt qu'au nom de fichier.
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    listSearchableFields: ['alt', 'filename'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      // Facultatif : sans description, les pages reprennent le titre du
      // concert, le nom du musicien… La liste signale « Sans description ».
      label: 'Description de l’image',
      admin: {
        description:
          'Ce que montre l’image, en quelques mots : elle est lue aux personnes malvoyantes et aide le référencement. Proposée d’après le nom du fichier quand il est parlant.',
        placeholder: 'Ex. : Le chœur et l’orchestre au théâtre de Dole',
        components: {
          Field: '@/components/admin/AltTextField#AltTextField',
          Cell: '@/components/admin/MediaCells#MediaAltCell',
        },
      },
      hooks: {
        // La colonne refuse l'absence de valeur (ancien champ obligatoire) :
        // une description vide est enregistrée comme texte vide.
        // Absente d'une mise à jour partielle : la description en place est gardée.
        beforeChange: [({ value, originalDoc }) => (typeof value === 'string' ? value.trim() : (originalDoc?.alt ?? ''))],
      },
    },
    {
      // Champ ajouté par Payload aux collections d'images : seule sa cellule
      // de liste change (vignette, nom, dimensions).
      name: 'filename',
      type: 'text',
      // Sans libellé, Payload afficherait « Filename » en tête de colonne.
      label: 'Fichier',
      admin: { components: { Cell: '@/components/admin/MediaCells#MediaFileCell' } },
    },
  ],
};
