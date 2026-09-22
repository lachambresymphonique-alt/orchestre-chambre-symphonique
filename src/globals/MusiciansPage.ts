import type { GlobalConfig } from 'payload';

export const MusiciansPage: GlobalConfig = {
  slug: 'musicians-page',
  label: 'Page Musiciens',
  admin: {
    group: 'Pages',
    description:
      'Titres de la page Musiciens et des fiches individuelles. Les musiciens eux-mêmes se gèrent dans Contenu → Musiciens.',
  },
  fields: [
    {
      name: 'header',
      type: 'group',
      label: 'En-tête de page',
      fields: [
        { name: 'title', type: 'text', label: 'Titre', defaultValue: 'Les visages de l\'orchestre' },
        {
          name: 'lede',
          type: 'textarea',
          label: 'Phrase d\'introduction',
          defaultValue:
            'De 40 à 80 musiciens issus de conservatoires français, suisses et belges, réunis autour de la passion du répertoire symphonique.',
        },
      ],
    },
    {
      name: 'sections',
      type: 'group',
      label: 'Titres des pupitres',
      admin: { description: 'Noms affichés au-dessus de chaque groupe de musiciens et dans le fil d\'Ariane des fiches.' },
      fields: [
        { name: 'direction', type: 'text', label: 'Direction artistique', defaultValue: 'Direction artistique' },
        { name: 'cordes', type: 'text', label: 'Cordes', defaultValue: 'Les Cordes' },
        { name: 'vents', type: 'text', label: 'Vents', defaultValue: 'Les Vents' },
        { name: 'claviers', type: 'text', label: 'Claviers & percussions', defaultValue: 'Claviers & Percussions' },
      ],
    },
    {
      name: 'detail',
      type: 'group',
      label: 'Fiche musicien — libellés',
      fields: [
        {
          name: 'inspiringLabel',
          type: 'text',
          label: 'Question « symphonie »',
          defaultValue: 'La symphonie qui lui a donné envie de faire de la musique',
        },
        { name: 'favoriteWorkLabel', type: 'text', label: 'Libellé œuvre préférée', defaultValue: 'Œuvre préférée' },
        { name: 'favoriteComposerLabel', type: 'text', label: 'Libellé compositeur préféré', defaultValue: 'Compositeur préféré' },
        { name: 'formationTitle', type: 'text', label: 'Titre Formation', defaultValue: 'Formation' },
        { name: 'concoursTitle', type: 'text', label: 'Titre Concours et distinctions', defaultValue: 'Concours et distinctions' },
        { name: 'videoTitle', type: 'text', label: 'Titre de la vidéo', defaultValue: 'En écoute' },
        { name: 'backLabel', type: 'text', label: 'Lien de retour', defaultValue: 'Retour aux musiciens' },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'Référencement',
      fields: [
        { name: 'metaTitle', type: 'text', label: 'Titre de la page (onglet, Google)', defaultValue: 'Musiciens — La Chambre Symphonique' },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Description (Google, réseaux sociaux)',
          defaultValue: 'Les musiciens de l\'Orchestre de la Chambre Symphonique, dirigé par Loïc Emmelin.',
        },
      ],
    },
  ],
};
