import type { GlobalConfig } from 'payload';
import { DIRECTOR_PAGE_DEFAULTS as D } from '../lib/directorDefaults';

const EMPHASIS_HINT = 'Entourez un mot d\'astérisques pour le mettre en italique coloré : *vivante*.';

export const DirectorPage: GlobalConfig = {
  slug: 'director-page',
  label: 'Page Direction',
  admin: {
    group: 'Pages',
    description:
      'Contenu de la page Direction. La photo, le rôle, la phrase signature, la biographie, la formation, la vidéo et la citation du chef viennent de sa fiche dans Musiciens ; ici se règlent le choix du musicien, les titres, les boutons et les textes par défaut.',
  },
  fields: [
    {
      name: 'director',
      type: 'relationship',
      relationTo: 'musicians' as any,
      label: 'Musicien présenté (le chef)',
      filterOptions: { section: { equals: 'direction' } } as any,
      admin: {
        description:
          'Sa fiche alimente la page. Si vide, le premier musicien de la section « Direction artistique » est utilisé.',
      },
    },
    {
      name: 'hero',
      type: 'group',
      label: 'En-tête',
      admin: { description: 'Portrait, nom et présentation en haut de la page.' },
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          label: 'Sur-titre',
          defaultValue: D.hero.eyebrow,
          admin: { description: 'Petit texte au-dessus du nom.' },
        },
        {
          name: 'ledeFallback',
          type: 'textarea',
          label: 'Phrase de présentation par défaut',
          defaultValue: D.hero.ledeFallback,
          admin: {
            description:
              'Affichée sous le nom si la fiche du musicien n\'a pas de « Phrase signature ».',
          },
        },
        {
          name: 'facts',
          type: 'array',
          label: 'Bandeau de faits',
          labels: { singular: 'Fait', plural: 'Faits' },
          maxRows: 4,
          defaultValue: D.hero.facts,
          admin: {
            description:
              'Petites cases sous la présentation. La première case « Fonction » est ajoutée automatiquement à partir du rôle de la fiche.',
          },
          fields: [
            { name: 'label', type: 'text', required: true, label: 'Libellé', admin: { description: 'Ex : « Fondateur »' } },
            { name: 'value', type: 'text', required: true, label: 'Valeur', admin: { description: 'Ex : « La Chambre Symphonique, 2017 »' } },
          ],
        },
        { name: 'ctaPrimaryText', type: 'text', label: 'Bouton principal — texte', defaultValue: D.hero.ctaPrimaryText },
        { name: 'ctaPrimaryLink', type: 'text', label: 'Bouton principal — lien', defaultValue: D.hero.ctaPrimaryLink, admin: { description: 'Ex : /#concerts, /contact ou une adresse complète.' } },
        { name: 'ctaSecondaryText', type: 'text', label: 'Lien secondaire — texte', defaultValue: D.hero.ctaSecondaryText },
        { name: 'ctaSecondaryLink', type: 'text', label: 'Lien secondaire — lien', defaultValue: D.hero.ctaSecondaryLink },
      ],
    },
    {
      name: 'story',
      type: 'group',
      label: 'Section Biographie',
      admin: { description: 'Titre de la section et biographie affichée si la fiche n\'en a pas.' },
      fields: [
        { name: 'eyebrow', type: 'text', label: 'Sur-titre', defaultValue: D.story.eyebrow },
        { name: 'title', type: 'text', label: 'Titre', defaultValue: D.story.title, admin: { description: EMPHASIS_HINT } },
        {
          name: 'bioFallback',
          type: 'textarea',
          label: 'Biographie par défaut',
          defaultValue: D.story.bioFallback,
          admin: {
            description:
              'Affichée si la fiche du musicien n\'a pas de biographie. Paragraphes séparés par une ligne vide.',
          },
        },
      ],
    },
    {
      name: 'path',
      type: 'group',
      label: 'Section Parcours',
      admin: { description: 'Visible uniquement si la fiche a une formation, des distinctions ou une vidéo.' },
      fields: [
        { name: 'eyebrow', type: 'text', label: 'Sur-titre', defaultValue: D.path.eyebrow },
        { name: 'title', type: 'text', label: 'Titre', defaultValue: D.path.title, admin: { description: EMPHASIS_HINT } },
      ],
    },
    {
      name: 'encore',
      type: 'group',
      label: 'Section « Et après »',
      admin: { description: 'Cartes de fin de page renvoyant vers le reste du site.' },
      fields: [
        { name: 'eyebrow', type: 'text', label: 'Sur-titre', defaultValue: D.encore.eyebrow },
        { name: 'title', type: 'text', label: 'Titre', defaultValue: D.encore.title, admin: { description: EMPHASIS_HINT } },
        {
          name: 'cards',
          type: 'array',
          label: 'Cartes',
          labels: { singular: 'Carte', plural: 'Cartes' },
          maxRows: 3,
          defaultValue: D.encore.cards,
          fields: [
            { name: 'eyebrow', type: 'text', label: 'Sur-titre', admin: { description: 'Ex : « La saison »' } },
            { name: 'title', type: 'text', required: true, label: 'Titre', admin: { description: EMPHASIS_HINT } },
            { name: 'linkLabel', type: 'text', required: true, label: 'Texte du lien', admin: { description: 'Ex : « Voir la programmation »' } },
            { name: 'link', type: 'text', required: true, label: 'Lien', admin: { description: 'Ex : /musiciens, /#concerts, /nous-soutenir' } },
          ],
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'Référencement',
      admin: { description: 'Titre et description affichés par les moteurs de recherche. Laisser vide pour les générer à partir de la fiche.' },
      fields: [
        { name: 'metaTitle', type: 'text', label: 'Titre de la page (onglet, Google)' },
        { name: 'metaDescription', type: 'textarea', label: 'Description (Google, réseaux sociaux)' },
      ],
    },
  ],
};
