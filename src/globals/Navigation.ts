import type { GlobalConfig } from 'payload'
import { BUILTIN_PAGES } from '../lib/navigation'

const isUrlLike = (value: string) =>
  /^(\/(?!\/)|https?:\/\/|mailto:|tel:)/i.test(value)

/** Contexte de validation d'un champ d'une ligne du menu (ses champs frères). */
type RowContext = { siblingData?: { type?: string } }

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Menu du site',
  admin: {
    group: 'Réglages',
    description:
      'Les entrées du menu principal, dans l\'ordre d\'affichage. Glissez-déposez pour réordonner. Une page créée dans « Pages » s\'ajoute ici pour apparaître dans le menu.',
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Entrées du menu',
      labels: { singular: 'Entrée', plural: 'Entrées' },
      admin: {
        description: 'Conseil : au-delà de 6 ou 7 entrées, le menu déborde sur tablette.',
        components: {
          RowLabel: '@/components/admin/NavItemRowLabel#NavItemRowLabel',
        },
      },
      fields: [
        {
          name: 'type',
          type: 'radio',
          label: 'Type de lien',
          required: true,
          defaultValue: 'builtin',
          options: [
            { label: 'Page du site', value: 'builtin' },
            { label: 'Page créée dans l\'admin', value: 'page' },
            { label: 'Lien libre', value: 'custom' },
          ],
          admin: { layout: 'horizontal' },
        },
        {
          name: 'builtin',
          type: 'select',
          label: 'Page',
          options: BUILTIN_PAGES.map(({ value, label }) => ({ value, label })),
          admin: { condition: (_data, siblingData) => siblingData?.type === 'builtin' },
          validate: (value: unknown, { siblingData }: RowContext) =>
            siblingData?.type === 'builtin' && !value ? 'Choisissez une page.' : true,
        },
        {
          name: 'page',
          type: 'relationship',
          relationTo: 'pages',
          label: 'Page',
          admin: {
            condition: (_data, siblingData) => siblingData?.type === 'page',
            description: 'Seules les pages publiées apparaissent dans le menu.',
          },
          validate: (value: unknown, { siblingData }: RowContext) =>
            siblingData?.type === 'page' && !value ? 'Choisissez une page.' : true,
        },
        {
          name: 'url',
          type: 'text',
          label: 'Adresse',
          admin: {
            condition: (_data, siblingData) => siblingData?.type === 'custom',
            description: 'Ex : https://www.helloasso.com/… ou /saison-2026',
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
          name: 'newTab',
          type: 'checkbox',
          label: 'Ouvrir dans un nouvel onglet',
          defaultValue: false,
          admin: { condition: (_data, siblingData) => siblingData?.type === 'custom' },
        },
        {
          name: 'label',
          type: 'text',
          label: 'Texte affiché',
          admin: {
            description: 'Facultatif pour une page : si vide, le nom de la page est utilisé.',
          },
          validate: (value: unknown, { siblingData }: RowContext) =>
            siblingData?.type === 'custom' && !String(value ?? '').trim()
              ? 'Indiquez le texte du lien.'
              : true,
        },
      ],
    },
  ],
}
