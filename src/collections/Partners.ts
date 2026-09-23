import type { CollectionConfig } from 'payload';

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: { singular: 'Partenaire', plural: 'Partenaires' },
  admin: {
    useAsTitle: 'name',
    group: 'Contenu',
    description: 'Logos et liens des partenaires affichés en bas de la page d\'accueil.',
    defaultColumns: ['logo', 'name', 'url'],
  },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nom du partenaire' },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo',
      admin: {
        description:
          'Sur le site, le logo est affiché en clair sur le fond sombre : choisissez un SVG ou un PNG à fond transparent. Sans logo, c’est le nom du partenaire qui s’affiche, comme aujourd’hui.',
      },
    },
    {
      name: 'url',
      type: 'text',
      label: 'Site web',
      admin: {
        description:
          'Adresse du site du partenaire (ex : https://exemple.fr). Le logo ou le nom devient alors un lien qui s’ouvre dans un nouvel onglet. « exemple.fr » suffit, le https est ajouté.',
      },
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
