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
        : [...TYPE_OPTIONS, { label: 'Titre seul (ouvre un sous-menu)', value: 'group' }],
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
      name: 'depth',
      type: 'number',
      label: 'Niveau',
      defaultValue: 0,
      min: 0,
      max: 1,
      // Piloté par le glisser-déposer de l'éditeur (NavTree) : 0 pour une
      // entrée de premier niveau, 1 pour un lien rangé sous l'entrée du dessus.
      admin: { hidden: true },
    })
    fields.push({
      name: 'children',
      type: 'array',
      label: 'Liens du sous-menu',
      labels: { singular: 'Lien', plural: 'Liens' },
      // Ancienne forme des sous-menus, remplacée par la profondeur des lignes.
      // Conservée pour ne rien perdre de ce qui aurait été saisi : le site la
      // lit encore (resolveNavItems), l'éditeur ne l'écrit plus.
      admin: { hidden: true },
      fields: entryFields(true),
    })
  }
  return fields
}

/**
 * Menu principal du site (Réglages → Menu du site).
 *
 * Le menu est une seule liste à plat : chaque entrée porte son niveau (`depth`,
 * 0 ou 1) et une entrée de niveau 1 se range sous celle de niveau 0 qui la
 * précède. C'est l'éditeur NavTree qui dessine cette liste et qui pilote
 * l'ordre et les niveaux au glisser-déposer ; déplier une ligne y affiche les
 * champs ci-dessus, tels que Payload les rend d'habitude.
 */
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Menu du site',
  admin: {
    group: 'Réglages',
    description:
      'Glissez une entrée pour la déplacer, vers la droite pour la ranger sous celle du dessus. « Masquer » la retire du menu sans la supprimer. Pensez à enregistrer.',
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
          Field: '@/components/admin/NavTree#NavTree',
        },
      },
      fields: entryFields(false),
    },
  ],
}
