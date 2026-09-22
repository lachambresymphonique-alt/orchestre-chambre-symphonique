import type { GlobalConfig } from 'payload';

export const MediaPage: GlobalConfig = {
  slug: 'media-page',
  label: 'Page Médias',
  admin: {
    group: 'Pages',
    description: 'Titres de la page Médias. Les vidéos, enregistrements et photos se gèrent dans Contenu → Médias.',
  },
  fields: [
    {
      name: 'header',
      type: 'group',
      label: 'En-tête de page',
      fields: [
        { name: 'title', type: 'text', label: 'Titre', defaultValue: 'Médias' },
        {
          name: 'lede',
          type: 'textarea',
          label: 'Phrase d\'introduction',
          defaultValue: 'Retrouvez nos vidéos de concerts, nos enregistrements et notre galerie photographique.',
        },
      ],
    },
    {
      name: 'tabs',
      type: 'group',
      label: 'Onglets et titres de rubriques',
      fields: [
        { name: 'allLabel', type: 'text', label: 'Onglet « Tout »', defaultValue: 'Tout' },
        { name: 'videosLabel', type: 'text', label: 'Onglet / titre Vidéos', defaultValue: 'Vidéos' },
        { name: 'audioLabel', type: 'text', label: 'Onglet / titre Enregistrements', defaultValue: 'Enregistrements' },
        { name: 'photosLabel', type: 'text', label: 'Onglet Photos', defaultValue: 'Photos' },
        { name: 'galleryTitle', type: 'text', label: 'Titre de la galerie', defaultValue: 'Galerie photos' },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'Référencement',
      fields: [
        { name: 'metaTitle', type: 'text', label: 'Titre de la page (onglet, Google)', defaultValue: 'Médias — La Chambre Symphonique' },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Description (Google, réseaux sociaux)',
          defaultValue: 'Vidéos, enregistrements et galerie photos de La Chambre Symphonique, orchestre dirigé par Loïc Emmelin.',
        },
      ],
    },
  ],
};
