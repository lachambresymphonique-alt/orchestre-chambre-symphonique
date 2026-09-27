import type { CollectionConfig } from 'payload';
import { PAGE_SECTIONS } from '@/blocks';
import { withLegacyContent } from '@/lib/sections';
import { slugify } from '@/lib/slug';

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    group: 'Pages',
    description:
      'Pages libres du site. Créez une page et elle sera accessible à l\'URL choisie. Pour l\'afficher dans le menu : Réglages → Menu du site.',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    // Aperçu en direct : une route dédiée affiche le contenu en cours de
    // saisie, envoyé par l'admin (src/components/PagePreview.tsx). L'adresse
    // est fixe et non calculée depuis le slug : Payload ne propose le bouton
    // d'aperçu sur l'écran de création que pour une adresse fixe. Elle montre
    // aussi les brouillons, que la page publique /[slug] ne sert pas.
    // Prioritaire sur l'entrée « pages » du livePreview de payload.config.ts.
    livePreview: {
      url: '/apercu/pages',
    },
  },
  versions: {
    // Enregistrement automatique des brouillons : « Créer » ouvre tout de suite
    // la page en brouillon (Payload la crée), donc avec son aperçu en direct ;
    // plus rien ne se perd, et seul « Publier » met en ligne.
    drafts: { autosave: { interval: 1500 } },
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Enregistré depuis le constructeur : l'ancien contenu a été repris
        // dans les sections (voir withLegacyContent) ; le garder le ferait
        // réapparaître si toutes les sections étaient un jour supprimées.
        if (data && Array.isArray(data.layout)) data.content = null;
        return data;
      },
    ],
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
        description:
          'Fin de l’adresse de la page : « saison-2025 » donnera /saison-2025. Générée à partir du titre si vous la laissez vide ; accents et espaces sont convertis.',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            const typed = typeof value === 'string' ? value.trim() : '';
            if (typed) return slugify(typed) || typed;
            const title = (data as { title?: unknown } | undefined)?.title;
            return typeof title === 'string' && title.trim() ? slugify(title) : value;
          },
        ],
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'Le slug est requis.';
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
          return 'Utilisez uniquement des lettres minuscules, chiffres et tirets (ex : ma-nouvelle-page).';
        }
        const reserved = ['admin', 'api', 'a-propos', 'directeur-artistique', 'musiciens', 'medias', 'journal', 'blog', 'nous-soutenir', 'contact', 'concerts', 'solistes', 'recrutement', 'espace-membres', 'apercu'];
        if (reserved.includes(value)) {
          return `« ${value} » est déjà utilisé par une page du site. Choisissez un autre slug.`;
        }
        return true;
      },
    },
    {
      // Sections de la page (constructeur de pages), stockées en JSON
      // (blocksAsJSON) : voir src/blocks/index.ts et components/sections.
      name: 'layout',
      type: 'blocks',
      label: 'Sections de la page',
      labels: { singular: 'une section', plural: 'Sections' },
      blocks: PAGE_SECTIONS,
      admin: {
        components: { Field: '@/components/admin/SectionsField#SectionsField' },
        description:
          'La page se compose de sections, dans l’ordre de cette liste : faites-les glisser par leur poignée pour les déplacer, et utilisez le menu ⋯ d’une section pour la dupliquer ou la supprimer.',
      },
      hooks: {
        // Page d'avant les sections : son ancien contenu arrive comme une
        // section « Texte », modifiable comme les autres.
        afterRead: [({ value, siblingData }) => withLegacyContent(value, siblingData?.content)],
      },
    },
    {
      // Ancien champ unique, d'avant les sections. Jamais saisi : à la lecture,
      // son contenu devient une section « Texte » (hook de `layout`) ; au
      // premier enregistrement avec des sections, il est vidé, le texte vivant
      // désormais dans cette section (l'historique des versions garde tout).
      name: 'content',
      type: 'richText',
      label: 'Ancien contenu',
      admin: { hidden: true },
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
    // Anciens réglages de navigation, remplacés par le global « Menu du site »
    // (Réglages → Menu du site). Conservés en base et masqués dans l'admin :
    // ils servent encore de menu de repli tant que le menu n'est pas configuré.
    {
      name: 'showInNav',
      type: 'checkbox',
      label: 'Afficher dans la navigation',
      defaultValue: false,
      admin: { hidden: true },
    },
    {
      name: 'navOrder',
      type: 'number',
      label: 'Ordre dans le menu',
      defaultValue: 99,
      admin: { hidden: true },
    },
    {
      name: 'navLabel',
      type: 'text',
      label: 'Libellé du menu',
      admin: { hidden: true },
    },
  ],
};
