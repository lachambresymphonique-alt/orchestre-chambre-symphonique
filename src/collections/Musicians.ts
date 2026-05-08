import type { CollectionConfig } from 'payload';

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const Musicians: CollectionConfig = {
  slug: 'musicians',
  labels: { singular: 'Musicien', plural: 'Musiciens' },
  admin: {
    useAsTitle: 'name',
    group: 'Contenu',
    description: 'Membres de l\'orchestre, classés par section.',
    defaultColumns: ['photo', 'name', 'instrument', 'section'],
    components: {
      beforeList: ['@/components/admin/MusiciansTabsNav#MusiciansTabsNav'],
    },
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
      name: 'instagram',
      type: 'text',
      label: 'Instagram',
      admin: {
        description: 'Identifiant ou URL Instagram du musicien (ex : @nom_compte). Utile pour le partage sur Instagram.',
      },
    },
    {
      name: 'tagline',
      type: 'text',
      label: 'Phrase signature',
      admin: { description: 'Une phrase courte qui résume le musicien (optionnel).' },
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'Biographie',
      admin: { description: 'Quelques paragraphes — formation, parcours, répertoire.' },
    },
    {
      name: 'inspiringSymphony',
      type: 'text',
      label: 'La symphonie qui lui a donné envie de faire de la musique',
      admin: {
        description: 'Affiché sur la fiche du musicien (optionnel).',
      },
    },
    {
      name: 'favoriteWork',
      type: 'text',
      label: 'Œuvre préférée',
      admin: { description: 'Affiché sur la fiche du musicien (optionnel).' },
    },
    {
      name: 'favoriteComposer',
      type: 'text',
      label: 'Compositeur préféré',
      admin: { description: 'Affiché sur la fiche du musicien (optionnel).' },
    },
    {
      name: 'formation',
      type: 'array',
      label: 'Formation',
      admin: {
        description: 'Établissements, diplômes, master classes (une entrée par ligne).',
      },
      labels: { singular: 'Entrée', plural: 'Entrées' },
      fields: [
        { name: 'item', type: 'text', required: true, label: 'Texte' },
      ],
    },
    {
      name: 'concours',
      type: 'array',
      label: 'Concours et distinctions',
      admin: {
        description: 'Prix, finales, récompenses (une entrée par ligne).',
      },
      labels: { singular: 'Entrée', plural: 'Entrées' },
      fields: [
        { name: 'item', type: 'text', required: true, label: 'Texte' },
      ],
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'Vidéo',
      admin: {
        description: 'Lien YouTube ou Vimeo (ex : https://youtu.be/abc123 ou https://vimeo.com/123456). La vidéo sera intégrée sur la fiche du musicien.',
      },
    },
    {
      name: 'quote',
      type: 'textarea',
      label: 'Citation',
      admin: { description: 'Une phrase ou deux du musicien lui-même (optionnel).' },
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
