import type { CollectionConfig } from 'payload';

export const MusicianSubmissions: CollectionConfig = {
  slug: 'musician-submissions',
  labels: { singular: 'Fiche musicien reçue', plural: 'Fiches musiciens reçues' },
  admin: {
    group: 'Messages reçus',
    description:
      'Fiches remplies par les musiciens via le formulaire public. À relire puis recopier dans la collection Musiciens.',
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'instrument', 'section', 'phone', 'status', 'createdAt'],
    components: {
      beforeList: ['@/components/admin/MusiciansTabsNav#MusiciansTabsNav'],
      edit: {
        beforeDocumentControls: [
          '@/components/admin/PromoteSubmissionButton#PromoteSubmissionButton',
        ],
      },
    },
  },
  access: {
    create: () => true,
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    { name: 'firstName', type: 'text', required: true, label: 'Prénom' },
    { name: 'lastName', type: 'text', required: true, label: 'Nom' },
    {
      name: 'name',
      type: 'text',
      label: 'Nom complet',
      admin: {
        readOnly: true,
        description: 'Calculé automatiquement à partir du prénom et du nom.',
      },
    },
    { name: 'email', type: 'email', required: true, label: 'E-mail de contact' },
    { name: 'phone', type: 'text', label: 'Téléphone' },
    { name: 'instagram', type: 'text', label: 'Instagram' },
    { name: 'role', type: 'text', required: true, label: 'Rôle / fonction' },
    { name: 'instrument', type: 'text', label: 'Instrument' },
    {
      name: 'section',
      type: 'select',
      label: 'Section',
      options: [
        { label: 'Direction artistique', value: 'direction' },
        { label: 'Cordes', value: 'cordes' },
        { label: 'Vents', value: 'vents' },
        { label: 'Claviers & Percussions', value: 'claviers' },
      ],
    },
    { name: 'bio', type: 'textarea', label: 'Biographie' },
    {
      name: 'inspiringSymphony',
      type: 'text',
      label: 'La symphonie qui lui a donné envie de faire de la musique',
    },
    { name: 'favoriteWork', type: 'text', label: 'Œuvre préférée' },
    { name: 'favoriteComposer', type: 'text', label: 'Compositeur préféré' },
    {
      name: 'formation',
      type: 'textarea',
      label: 'Formation',
      admin: { description: 'Une entrée par ligne.' },
    },
    {
      name: 'concours',
      type: 'textarea',
      label: 'Concours et distinctions',
      admin: { description: 'Une entrée par ligne.' },
    },
    { name: 'videoUrl', type: 'text', label: 'Lien vidéo (YouTube / Vimeo)' },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Photo envoyée',
      admin: {
        description: 'Photo téléversée par le musicien via le formulaire.',
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Statut',
      defaultValue: 'nouveau',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Nouveau', value: 'nouveau' },
        { label: 'En cours de traitement', value: 'en-cours' },
        { label: 'Recopié dans Musiciens', value: 'traite' },
        { label: 'Rejeté', value: 'rejete' },
      ],
    },
  ],
};
