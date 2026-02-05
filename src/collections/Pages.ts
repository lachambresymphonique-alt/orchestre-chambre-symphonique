import type { CollectionConfig } from 'payload';

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    group: 'Pages',
    description: 'Pages libres du site. Créez une page et elle sera accessible à l\'URL choisie.',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    livePreview: {
      url: ({ data }) => {
        const base = process.env.NEXT_PUBLIC_SITE_URL || '';
        return `${base}/${data?.slug || ''}`;
      },
    },
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Titre de la page',
      admin: { description: 'Titre principal affiché en haut de la page et dans l\'onglet du navigateur.' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Adresse (slug)',
      admin: {
        description: 'L\'URL de la page. Ex : « saison-2025 » donnera /saison-2025. Pas d\'espaces ni de caractères spéciaux.',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'Le slug est requis.';
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
          return 'Utilisez uniquement des lettres minuscules, chiffres et tirets (ex : ma-nouvelle-page).';
        }
        const reserved = ['admin', 'api', 'a-propos', 'musiciens', 'medias', 'nous-soutenir', 'contact'];
        if (reserved.includes(value)) {
          return `« ${value} » est déjà utilisé par une page du site. Choisissez un autre slug.`;
        }
        return true;
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: 'Contenu',
      admin: { description: 'Le contenu principal de la page. Vous pouvez ajouter des titres, du texte, des listes, des liens et des images.' },
    },
    {
      name: 'meta',
      type: 'group',
      label: 'Référencement (SEO)',
      admin: { description: 'Optionnel. Améliore la visibilité de la page sur Google.', condition: () => true },
      fields: [
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
          admin: { description: 'Résumé de la page affiché dans les résultats Google (160 caractères max).' },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Image de partage',
          admin: { description: 'Image affichée quand la page est partagée sur les réseaux sociaux.' },
        },
      ],
    },
    {
      name: 'showInNav',
      type: 'checkbox',
      label: 'Afficher dans la navigation',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Cocher pour ajouter un lien vers cette page dans le menu du site.',
      },
    },
    {
      name: 'navOrder',
      type: 'number',
      label: 'Ordre dans le menu',
      defaultValue: 99,
      admin: {
        position: 'sidebar',
        description: 'Position dans le menu (les pages existantes vont de 1 à 6).',
        condition: (data) => data?.showInNav,
      },
    },
    {
      name: 'navLabel',
      type: 'text',
      label: 'Libellé du menu',
      admin: {
        position: 'sidebar',
        description: 'Texte affiché dans le menu. Si vide, le titre sera utilisé.',
        condition: (data) => data?.showInNav,
      },
    },
  ],
};
