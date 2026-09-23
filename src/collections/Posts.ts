import type { CollectionBeforeChangeHook, CollectionConfig, FieldHook } from 'payload';
import {
  BlockquoteFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  IndentFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical';
import { POST_CATEGORIES } from '../lib/postCategories';
import { SLUG_PATTERN, slugify } from '../lib/slug';

const trim: FieldHook = ({ value }) => (typeof value === 'string' ? value.trim() : value);

// Adresses relatives : l'aperçu s'ouvre sur le domaine de l'admin, où la
// session est connue (brouillons visibles) et où l'aperçu en direct peut
// dialoguer avec le formulaire. Voir livePreview dans payload.config.ts.
const siteUrl = () => '';

/**
 * Quand l’adresse d’un article change, l’ancienne est conservée dans
 * `slugHistory` : la page /blog/[slug] la redirige (308) vers la nouvelle.
 * L’adresse courante n’y figure jamais, ce qui exclut toute boucle.
 */
const rememberPreviousSlug: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const next = typeof data?.slug === 'string' ? data.slug : undefined;
  const previous = typeof originalDoc?.slug === 'string' ? originalDoc.slug : undefined;
  if (!next) return data;

  const source: unknown[] = Array.isArray(data?.slugHistory)
    ? data.slugHistory
    : Array.isArray(originalDoc?.slugHistory)
      ? originalDoc.slugHistory
      : [];
  const slugs = new Set<string>();
  for (const entry of source) {
    const s = (entry as { slug?: unknown } | null)?.slug;
    if (typeof s === 'string' && s) slugs.add(s);
  }
  if (previous && previous !== next) slugs.add(previous);
  slugs.delete(next);

  data.slugHistory = [...slugs].map((slug) => ({ slug }));
  return data;
};

/**
 * Le blog de l’orchestre : retours sur les projets passés, entretiens,
 * actualités. Publié sur /blog et /blog/[slug].
 *
 * L’écran d’édition est mis en page comme l’article publié : bandeau sombre
 * (rubrique, date, titre, chapeau), image de couverture, puis le texte avec
 * la typographie du site. Les deux groupes sans nom ci-dessous n’existent que
 * pour cette mise en page (voir src/components/admin/admin-article.css) : ils
 * ne changent ni les données enregistrées ni le schéma de la base.
 */
export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Article', plural: 'Blog' },
  admin: {
    useAsTitle: 'title',
    group: 'Contenu',
    description:
      'Le blog de l\'orchestre : retours sur les projets passés, entretiens, actualités. Un article publié apparaît sur la page Blog du site à partir de sa date de publication ; un brouillon reste invisible.',
    defaultColumns: ['cover', 'title', 'category', 'publishedAt', '_status'],
    listSearchableFields: ['title', 'excerpt'],
    components: {
      beforeList: ['@/components/admin/PostsListNav#PostsListNav'],
    },
    livePreview: {
      url: ({ data }) => `${siteUrl()}/blog/${data?.slug || ''}`,
    },
    preview: (doc) => `${siteUrl()}/blog/${(doc as any)?.slug || ''}`,
  },
  defaultSort: '-publishedAt',
  versions: {
    drafts: true,
  },
  hooks: {
    beforeChange: [rememberPreviousSlug],
  },
  fields: [
    // ── I. En-tête de l’article : le bandeau, comme sur le site ──────────
    {
      type: 'group',
      label: false,
      admin: { className: 'lcs-article lcs-article--hero', hideGutter: true },
      fields: [
        {
          // Charge les polices du site, applique la typographie des titres
          // choisie dans « Apparence du site » et affiche le fil d’Ariane.
          name: 'lcsArticleCanvas',
          type: 'ui',
          admin: {
            components: { Field: '@/components/admin/ArticleCanvas#ArticleCanvas' },
          },
        },
        {
          type: 'row',
          admin: { className: 'lcs-article__meta' },
          fields: [
            {
              name: 'category',
              type: 'select',
              required: true,
              defaultValue: 'projet',
              label: 'Rubrique',
              options: POST_CATEGORIES.map((c) => ({ label: c.label, value: c.value })),
            },
            {
              name: 'publishedAt',
              type: 'date',
              required: true,
              label: 'Date de publication',
              defaultValue: () => new Date().toISOString(),
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                  displayFormat: 'EEEE d MMMM yyyy',
                },
                description: 'Une date à venir programme la parution.',
              },
            },
          ],
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'Titre',
          hooks: { beforeValidate: [trim] },
          admin: {
            placeholder: 'Titre de l’article',
            components: {
              Field: {
                path: '@/components/admin/ArticleTextField#ArticleTextField',
                clientProps: { variant: 'title' },
              },
            },
          },
        },
        {
          name: 'excerpt',
          type: 'textarea',
          label: 'Chapeau',
          maxLength: 320,
          hooks: { beforeValidate: [trim] },
          admin: {
            placeholder:
              'Chapeau : deux ou trois phrases qui donnent envie de lire. Elles apparaissent sous le titre et dans la liste du blog.',
            components: {
              Field: {
                path: '@/components/admin/ArticleTextField#ArticleTextField',
                clientProps: { variant: 'lede' },
              },
            },
          },
        },

        // ── Spécifique aux entretiens ─────────────────────────────────────
        {
          name: 'guest',
          type: 'group',
          label: 'Personne interviewée',
          admin: {
            condition: (data) => data?.category === 'entretien',
            description: 'Affiché sous le titre : « Entretien avec … ».',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  label: 'Nom',
                  hooks: { beforeValidate: [trim] },
                  admin: { width: '50%' },
                },
                {
                  name: 'role',
                  type: 'text',
                  label: 'Rôle',
                  hooks: { beforeValidate: [trim] },
                  admin: { width: '50%', placeholder: 'Violoncelle solo, mécène, compositrice…' },
                },
              ],
            },
            {
              name: 'musician',
              type: 'relationship',
              relationTo: 'musicians',
              label: 'Fiche musicien',
              admin: {
                description:
                  'Optionnel. Si la personne est membre de l\'orchestre, l\'article renvoie vers sa fiche.',
              },
            },
          ],
        },

        // ── Spécifique aux retours sur projet ─────────────────────────────
        {
          name: 'project',
          type: 'group',
          label: 'Le projet',
          admin: {
            condition: (data) => data?.category === 'projet',
          },
          fields: [
            {
              name: 'period',
              type: 'text',
              label: 'Période',
              hooks: { beforeValidate: [trim] },
              admin: {
                placeholder: 'Juin 2024, Saison 2023-2024…',
                description: 'Quand le projet a eu lieu. Affiché sous le titre.',
              },
            },
            {
              name: 'concerts',
              type: 'relationship',
              relationTo: 'concerts',
              hasMany: true,
              label: 'Concerts liés',
              admin: {
                description:
                  'Les dates de ce projet telles qu\'elles sont enregistrées dans Concerts. Elles s\'affichent en fin d\'article.',
              },
            },
          ],
        },
      ],
    },

    // ── II. Couverture et texte ───────────────────────────────────────────
    {
      type: 'group',
      label: false,
      admin: { className: 'lcs-article lcs-article--body', hideGutter: true },
      fields: [
        {
          name: 'cover',
          type: 'upload',
          relationTo: 'media',
          label: 'Image de couverture',
          admin: {
            components: { Field: '@/components/admin/ArticleCoverField#ArticleCoverField' },
          },
        },
        {
          name: 'content',
          type: 'richText',
          required: true,
          label: 'Texte de l\'article',
          editor: lexicalEditor({
            // Une barre d’outils toujours visible (titres, gras, italique,
            // listes, citation, lien, image) en plus de celle qui apparaît
            // à la sélection. Un seul h1 par page (le titre de l’article) :
            // le corps va de « Titre 2 » à « Titre 4 ».
            features: () => [
              ParagraphFeature(),
              HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
              BoldFeature(),
              ItalicFeature(),
              UnderlineFeature(),
              LinkFeature({ enabledCollections: ['posts', 'pages', 'musicians'] }),
              UnorderedListFeature(),
              OrderedListFeature(),
              IndentFeature(),
              BlockquoteFeature(),
              HorizontalRuleFeature(),
              UploadFeature({
                collections: {
                  media: {
                    fields: [
                      {
                        name: 'caption',
                        type: 'text',
                        label: 'Légende',
                        admin: { description: 'Affichée sous la photo, en petit.' },
                      },
                    ],
                  },
                },
              }),
              // Tout à plat, pas de menus déroulants : paragraphe, titres,
              // listes et citation d'abord, puis gras/italique, lien, retrait,
              // et « Image » en dernier (libellé en toutes lettres, voir
              // admin-article.css).
              FixedToolbarFeature({
                customGroups: {
                  text: { type: 'buttons', order: 5 },
                  add: { type: 'buttons', order: 60 },
                },
              }),
              InlineToolbarFeature(),
            ],
          }),
          admin: {
            description:
              'Pour un entretien : chaque question en gras (ou en « Titre 3 »), la réponse en paragraphe ; la citation détache une phrase forte.',
          },
        },
      ],
    },

    // ── III. Compléments ──────────────────────────────────────────────────
    {
      name: 'gallery',
      type: 'array',
      label: 'Galerie photos',
      labels: { singular: 'Photo', plural: 'Photos' },
      admin: {
        description:
          'Optionnel. Une série de photos affichée après le texte — idéal pour un retour sur concert.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Photo',
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Légende',
          hooks: { beforeValidate: [trim] },
        },
      ],
    },

    {
      name: 'meta',
      type: 'group',
      label: 'Référencement (SEO)',
      admin: {
        description: 'Optionnel. Si vide, le chapeau et l\'image de couverture sont utilisés.',
      },
      fields: [
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
          maxLength: 160,
          admin: { description: 'Résumé affiché dans les résultats Google (160 caractères max).' },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Image de partage',
          admin: { description: 'Image affichée quand l\'article est partagé sur les réseaux sociaux.' },
        },
      ],
    },

    // ── Sidebar ──────────────────────────────────────────────────────────
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      label: 'Adresse (slug)',
      admin: {
        position: 'sidebar',
        description:
          'Fin de l\'adresse de l\'article : /blog/mon-article. Généré à partir du titre si laissé vide.',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            const typed = typeof value === 'string' ? value.trim() : '';
            if (typed) return slugify(typed) || typed;
            const title = (data as any)?.title;
            return typeof title === 'string' && title.trim() ? slugify(title) : value;
          },
        ],
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'L\'adresse est requise : renseignez d\'abord un titre.';
        if (!SLUG_PATTERN.test(value)) {
          return 'Utilisez uniquement des lettres minuscules, chiffres et tirets (ex : retour-sur-tournus).';
        }
        return true;
      },
    },
    {
      name: 'slugHistory',
      type: 'array',
      label: 'Anciennes adresses',
      labels: { singular: 'Ancienne adresse', plural: 'Anciennes adresses' },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          'Remplies automatiquement quand l\'adresse change : chaque ancienne adresse redirige vers l\'article, les liens déjà partagés continuent de fonctionner.',
        condition: (data) => Array.isArray(data?.slugHistory) && data.slugHistory.length > 0,
      },
      fields: [{ name: 'slug', type: 'text', required: true, index: true, label: 'Slug' }],
    },
  ],
};
