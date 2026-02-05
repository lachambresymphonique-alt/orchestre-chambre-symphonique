import type { CollectionConfig } from 'payload';

export const Musicians: CollectionConfig = {
  slug: 'musicians',
  labels: { singular: 'Musicien', plural: 'Musiciens' },
  admin: {
    useAsTitle: 'name',
    group: 'Contenu',
    description: 'Membres de l\'orchestre, classés par section.',
    defaultColumns: ['name', 'instrument', 'section'],
  },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nom complet' },
    {
      name: 'role',
      type: 'text',
      required: true,
      label: 'Rôle',
      admin: { description: 'Ex : « Directeur artistique », « Violoniste »' },
    },
    { name: 'instrument', type: 'text', label: 'Instrument' },
    {
      name: 'section',
      type: 'select',
      required: true,
      label: 'Section',
      admin: { description: 'Détermine le regroupement sur la page Musiciens.' },
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
      label: 'Ordre d\'affichage',
      admin: { position: 'sidebar', description: 'Plus petit = affiché en premier.' },
    },
  ],
};
