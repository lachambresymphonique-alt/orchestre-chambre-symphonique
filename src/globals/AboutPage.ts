import type { GlobalConfig } from 'payload'

export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: 'Page À propos',
  admin: {
    group: 'Pages',
    description: 'Contenu de la page À propos : introduction, chiffres clés.',
  },
  fields: [
    {
      name: 'header',
      type: 'group',
      label: 'En-tête de page',
      admin: { description: 'Titre et phrase d\'introduction tout en haut de la page.' },
      fields: [
        { name: 'title', type: 'text', label: 'Titre', defaultValue: 'L\'orchestre' },
        {
          name: 'lede',
          type: 'textarea',
          label: 'Phrase d\'introduction',
          defaultValue:
            'Un orchestre fondé en 2017 par Loïc Emmelin, porté par l\'ambition du répertoire symphonique en effectif resserré.',
        },
      ],
    },
    {
      name: 'intro',
      type: 'group',
      label: 'Introduction',
      admin: { description: 'Section de présentation en haut de la page.' },
      fields: [
        { name: 'subtitle', type: 'text', label: 'Sur-titre', admin: { description: 'Petit texte au-dessus du titre.' } },
        { name: 'title', type: 'text', label: 'Titre' },
        {
          name: 'content',
          type: 'textarea',
          label: 'Texte de présentation',
          admin: { description: 'Description de la mission et des valeurs de l\'orchestre.' },
        },
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Photo d\'illustration' },
      ],
    },
    {
      name: 'stats',
      type: 'array',
      label: 'Chiffres clés',
      maxRows: 6,
      admin: { description: 'Statistiques mises en avant (ex : « 80+ musiciens »). Maximum 6.' },
      fields: [
        {
          name: 'number',
          type: 'text',
          required: true,
          label: 'Chiffre',
          admin: { description: 'Ex : « 80+ », « 7 », « 2017 »' },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Libellé',
          admin: { description: 'Ex : « Musiciens passionnés », « Concerts par saison »' },
        },
      ],
    },
    {
      name: 'timeline',
      type: 'group',
      label: 'Section Frise',
      admin: { description: 'Titres de la frise chronologique. Les dates elles-mêmes se gèrent dans Contenu → Frise chronologique.' },
      fields: [
        { name: 'eyebrow', type: 'text', label: 'Sur-titre', defaultValue: 'Le parcours' },
        {
          name: 'title',
          type: 'text',
          label: 'Titre',
          defaultValue: '*Les grandes dates*',
          admin: { description: 'Un mot entre astérisques est mis en italique coloré.' },
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'Référencement',
      admin: { description: 'Titre et description pour Google et les réseaux sociaux.' },
      fields: [
        { name: 'metaTitle', type: 'text', label: 'Titre de la page (onglet, Google)', defaultValue: 'À propos — La Chambre Symphonique' },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Description (Google, réseaux sociaux)',
          defaultValue:
            'Découvrez l\'histoire de La Chambre Symphonique, orchestre fondé en 2017 par Loïc Emmelin, et son parcours de violoniste et chef d\'orchestre.',
        },
      ],
    },
  ],
}
