import type { CollectionConfig } from 'payload';

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: { singular: 'Partenaire', plural: 'Partenaires' },
  admin: {
    useAsTitle: 'name',
    group: 'Contenu',
    description: 'Logos et liens des partenaires affichés en bas de la page d\'accueil.',
    defaultColumns: ['name', 'url'],
  },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nom du partenaire' },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo',
      admin: { description: 'Image du logo (de préférence en SVG ou PNG transparent).' },
    },
    {
      name: 'url',
      type: 'text',
      label: 'Site web',
      admin: { description: 'URL complète du site du partenaire (ex : https://...).' },
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
