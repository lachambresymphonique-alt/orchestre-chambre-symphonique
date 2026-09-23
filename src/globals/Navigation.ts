import type { Field, GlobalConfig } from 'payload'
import { BUILTIN_PAGES } from '../lib/navigation'

const isUrlLike = (value: string) =>
  /^(\/(?!\/)|https?:\/\/|mailto:|tel:)/i.test(value)

/** Contexte de validation d'un champ d'une ligne du menu (ses champs frères). */
type RowContext = { siblingData?: { type?: string } }

const TYPE_OPTIONS = [
  { label: 'Page du site', value: 'builtin' },
  { label: 'Page créée dans l\'admin', value: 'page' },
  { label: 'Lien libre', value: 'custom' },
]

/**
 * Champs d'une entrée. Réutilisés pour les liens d'un sous-menu (`nested`),
 * qui n'ont pas eux-mêmes de sous-menu.
 */
function entryFields(nested: boolean): Field[] {
  const fields: Field[] = [
    {
      name: 'type',
      type: 'radio',
      label: 'Type de lien',
      required: true,
      defaultValue: 'builtin',
      options: nested
        ? TYPE_OPTIONS
        : [...TYPE_OPTIONS, { label: 'Sous-menu (un titre et ses liens)', value: 'group' }],
      admin: { layout: 'horizontal' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'builtin',
          type: 'select',
          label: 'Page',
          options: BUILTIN_PAGES.map(({ value, label }) => ({ value, label })),
          admin: {
            width: '50%',
            condition: (_data, siblingData) => siblingData?.type === 'builtin',
          },
          validate: (value: unknown, { siblingData }: RowContext) =>
            siblingData?.type === 'builtin' && !value ? 'Choisissez une page.' : true,
        },
        {
          name: 'page',
          type: 'relationship',
          relationTo: 'pages',
          label: 'Page (publiée)',
          admin: {
            width: '50%',
            condition: (_data, siblingData) => siblingData?.type === 'page',
          },
          validate: (value: unknown, { siblingData }: RowContext) =>
            siblingData?.type === 'page' && !value ? 'Choisissez une page.' : true,
        },
        {
          name: 'url',
          type: 'text',
          label: 'Adresse',
          admin: {
            width: '50%',
            placeholder: 'https://… ou /ma-page',
            condition: (_data, siblingData) => siblingData?.type === 'custom',
          },
          validate: (value: unknown, { siblingData }: RowContext) => {
            if (siblingData?.type !== 'custom') return true
            const v = String(value ?? '').trim()
            if (!v) return 'Indiquez l\'adresse du lien.'
            if (!isUrlLike(v)) return 'Commencez par « / » (page du site), « https:// », « mailto: » ou « tel: ».'
            return true
          },
        },
        {
          name: 'label',
          type: 'text',
          label: 'Texte affiché',
          admin: {
            width: '50%',
            placeholder: 'Par défaut : le nom de la page',
          },
          validate: (value: unknown, { siblingData }: RowContext) => {
            if (String(value ?? '').trim()) return true
            if (siblingData?.type === 'custom') return 'Indiquez le texte du lien.'
            if (siblingData?.type === 'group') return 'Indiquez le titre du sous-menu (ex. « Orchestre »).'
            return true
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'hidden',
          type: 'checkbox',
          label: 'Masquer dans le menu',
          defaultValue: false,
          admin: { width: '50%' },
        },
        {
          name: 'newTab',
          type: 'checkbox',
          label: 'Ouvrir dans un nouvel onglet',
          defaultValue: false,
          admin: {
            width: '50%',
            condition: (_data, siblingData) => siblingData?.type === 'custom',
          },
        },
      ],
    },
  ]
  if (!nested) {
    fields.push({
      name: 'children',
      type: 'array',
      label: 'Liens du sous-menu',
      labels: { singular: 'Lien', plural: 'Liens' },
      admin: {
        initCollapsed: true,
        description:
          'Le titre ci-dessus s\'affiche dans le menu ; ces liens s\'ouvrent au survol ou au clic. Glissez-les pour changer leur ordre.',
        condition: (_data, siblingData) => siblingData?.type === 'group',
        components: { RowLabel: '@/components/admin/NavItemRowLabel#NavItemRowLabel' },
      },
      validate: (value: unknown, { siblingData }: RowContext) =>
        siblingData?.type === 'group' && (!Array.isArray(value) || value.length === 0)
          ? 'Ajoutez au moins un lien au sous-menu.'
          : true,
      fields: entryFields(true),
    })
  }
  return fields
}

/**
 * Menu principal du site (Réglages → Menu du site).
 *
 * Écran pensé pour être lu d'un coup d'œil : les lignes sont repliées et leur
 * titre résume l'entrée (texte, type, adresse, état) avec un bouton
 * « Masquer / Afficher » (NavItemRowLabel) ; un compteur sous le titre donne le
 * nombre d'entrées affichées et masquées (NavItemsSummary). Dépliée, une ligne
 * tient en trois rangées : type, page + texte, options.
 */
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Menu du site',
  admin: {
    group: 'Réglages',
    description:
      'Glissez les entrées pour changer leur ordre. « Masquer » retire une entrée du menu sans la supprimer. Pensez à enregistrer.',
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Entrées du menu',
      labels: { singular: 'Entrée', plural: 'Entrées' },
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/components/admin/NavItemRowLabel#NavItemRowLabel',
          Description: '@/components/admin/NavItemsSummary#NavItemsSummary',
        },
      },
      fields: entryFields(false),
    },
  ],
}
