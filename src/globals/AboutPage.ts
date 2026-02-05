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
  ],
}
