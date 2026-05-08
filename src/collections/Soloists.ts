import type { CollectionConfig } from 'payload';

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const Soloists: CollectionConfig = {
  slug: 'soloists',
  labels: { singular: 'Soliste', plural: 'Solistes' },
  admin: {
    useAsTitle: 'name',
    group: 'Contenu',
    description:
      'Solistes invités — passés ou à venir. Sélectionnés ensuite dans Page d\'accueil › À la une.',
    defaultColumns: ['photo', 'name', 'instrument', 'order'],
  },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nom complet' },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug (URL)',
      admin: {
        position: 'sidebar',
        description: 'Auto-généré à partir du nom si laissé vide.',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (value) return value;
            const name = (data as any)?.name;
            return name ? slugify(name) : value;
          },
        ],
      },
    },
    {
      name: 'instrument',
      type: 'text',
      required: true,
      label: 'Instrument / discipline',
      admin: { description: 'Ex : « Violoncelle », « Soprano », « Piano »' },
    },
    {
      name: 'role',
      type: 'text',
      label: 'Précision',
      admin: {
        description:
          'Optionnel. Ex : « Premier prix CNSMD », « Soliste invité 2025 ».',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Portrait',
      admin: {
        description: 'Photo en portrait (3:4 ou 4:5 idéal).',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'Biographie courte',
      admin: { description: 'Quelques phrases. Affiché en complément du nom.' },
    },
    {
      name: 'tagline',
      type: 'text',
      label: 'Phrase signature',
      admin: { description: 'Une ligne, optionnelle, pour résumer.' },
    },
    {
      name: 'website',
      type: 'text',
      label: 'Site web',
      admin: { description: 'URL personnelle ou page de l\'agent.' },
    },
    {
      name: 'concert',
      type: 'relationship',
      relationTo: 'concerts' as any,
      label: 'Concert associé',
      admin: {
        description:
          'Concert auquel le ou la soliste est associé·e (passé ou à venir).',
      },
    },
    {
      name: 'context',
      type: 'text',
      label: 'Contexte d\'apparition',
      admin: {
        description:
          'Ce qui sera affiché à côté du nom (ex : « Concerto pour violon de Brahms — janvier 2026 »).',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'Ordre d\'affichage',
      admin: {
        position: 'sidebar',
        description: 'Plus petit = affiché en premier.',
      },
    },
  ],
};
