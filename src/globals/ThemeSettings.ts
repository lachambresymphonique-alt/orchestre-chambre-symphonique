import type { GlobalConfig } from 'payload';

export const ThemeSettings: GlobalConfig = {
  slug: 'theme-settings',
  label: 'Apparence du site',
  admin: {
    group: 'Réglages',
    description:
      "Le style du site : pour l'instant, la typographie de tous les titres.",
  },
  fields: [
    {
      name: 'displayFont',
      type: 'radio',
      label: 'Typographie des titres',
      defaultValue: 'fraunces-soft',
      options: [
        { label: 'Ibarra Real Nova', value: 'ibarra' },
        { label: 'Bodoni Moda', value: 'bodoni' },
        { label: 'Fraunces affûté', value: 'fraunces-sharp' },
        { label: 'Fraunces arrondi (dessin d\'origine)', value: 'fraunces-soft' },
      ],
      admin: {
        description:
          "S'applique à tous les titres du site : bannière, titres de section, noms de concerts et de musiciens. Enregistrez, puis rechargez le site pour voir le résultat.",
        components: {
          Field: '@/components/admin/DisplayFontField#DisplayFontField',
        },
      },
    },

    // ── Ancien système de thème (couleurs, mode clair/sombre, polices) ──
    // Aucune page du site ne l'a jamais lu : ces réglages n'avaient aucun
    // effet. Ils sont masqués plutôt que supprimés pour ne rien perdre en
    // base ; à retirer, colonnes comprises, une fois la décision prise.
    {
      name: 'mode',
      type: 'select',
      label: 'Mode d\'affichage',
      defaultValue: 'light',
      required: true,
      admin: {
        hidden: true,
        description: 'Choisissez le theme par defaut du site.',
      },
      options: [
        { label: 'Clair - fond creme, texte sombre', value: 'light' },
        { label: 'Sombre - fond noir, texte clair', value: 'dark' },
        { label: 'Hybride - sections alternees clair/sombre', value: 'hybrid' },
      ],
    },
    {
      name: 'allowUserToggle',
      type: 'checkbox',
      label: 'Permettre aux visiteurs de changer de theme',
      defaultValue: true,
      admin: {
        hidden: true,
        description: 'Affiche un bouton pour basculer entre les modes clair et sombre.',
      },
    },
    {
      name: 'colors',
      type: 'group',
      label: 'Couleurs',
      admin: {
        hidden: true,
        description: 'Personnalisez la palette de couleurs du site.',
      },
      fields: [
        {
          name: 'primary',
          type: 'text',
          label: 'Couleur principale (accent)',
          defaultValue: '#C9A84C',
          admin: {
            description: 'Couleur doree utilisee pour les boutons, liens et accents.',
            components: {
              Field: '@/components/admin/ColorPickerField#ColorPickerField',
            },
          },
        },
        {
          name: 'primaryLight',
          type: 'text',
          label: 'Couleur principale claire',
          defaultValue: '#E8D48B',
          admin: {
            description: 'Version plus claire de la couleur principale.',
            components: {
              Field: '@/components/admin/ColorPickerField#ColorPickerField',
            },
          },
        },
        {
          name: 'primaryDark',
          type: 'text',
          label: 'Couleur principale foncee',
          defaultValue: '#A07D2E',
          admin: {
            description: 'Version plus foncee de la couleur principale.',
            components: {
              Field: '@/components/admin/ColorPickerField#ColorPickerField',
            },
          },
        },
        {
          name: 'accent',
          type: 'text',
          label: 'Couleur d\'accentuation',
          defaultValue: '#8B1A1A',
          admin: {
            description: 'Couleur secondaire pour certains elements (bordeaux par defaut).',
            components: {
              Field: '@/components/admin/ColorPickerField#ColorPickerField',
            },
          },
        },
      ],
    },
    {
      name: 'lightTheme',
      type: 'group',
      label: 'Theme clair',
      admin: {
        hidden: true,
        description: 'Couleurs du mode clair.',
      },
      fields: [
        {
          name: 'background',
          type: 'text',
          label: 'Fond principal',
          defaultValue: '#FDFBF7',
          admin: {
            description: 'Couleur de fond des pages.',
            components: {
              Field: '@/components/admin/ColorPickerField#ColorPickerField',
            },
          },
        },
        {
          name: 'backgroundAlt',
          type: 'text',
          label: 'Fond alternatif',
          defaultValue: '#F5F0E8',
          admin: {
            description: 'Couleur de fond des sections alternees.',
            components: {
              Field: '@/components/admin/ColorPickerField#ColorPickerField',
            },
          },
        },
        {
          name: 'text',
          type: 'text',
          label: 'Texte principal',
          defaultValue: '#2C2C2C',
          admin: {
            components: {
              Field: '@/components/admin/ColorPickerField#ColorPickerField',
            },
          },
        },
        {
          name: 'textLight',
          type: 'text',
          label: 'Texte secondaire',
          defaultValue: '#6B6B6B',
          admin: {
            components: {
              Field: '@/components/admin/ColorPickerField#ColorPickerField',
            },
          },
        },
        {
          name: 'border',
          type: 'text',
          label: 'Bordures',
          defaultValue: '#E0D8CA',
          admin: {
            components: {
              Field: '@/components/admin/ColorPickerField#ColorPickerField',
            },
          },
        },
      ],
    },
    {
      name: 'darkTheme',
      type: 'group',
      label: 'Theme sombre',
      admin: {
        hidden: true,
        description: 'Couleurs du mode sombre.',
      },
      fields: [
        {
          name: 'background',
          type: 'text',
          label: 'Fond principal',
          defaultValue: '#1A1A2E',
          admin: {
            description: 'Couleur de fond des pages.',
            components: {
              Field: '@/components/admin/ColorPickerField#ColorPickerField',
            },
          },
        },
        {
          name: 'backgroundAlt',
          type: 'text',
          label: 'Fond alternatif',
          defaultValue: '#16213E',
          admin: {
            description: 'Couleur de fond des sections alternees.',
            components: {
              Field: '@/components/admin/ColorPickerField#ColorPickerField',
            },
          },
        },
        {
          name: 'text',
          type: 'text',
          label: 'Texte principal',
          defaultValue: '#F0EDE6',
          admin: {
            components: {
              Field: '@/components/admin/ColorPickerField#ColorPickerField',
            },
          },
        },
        {
          name: 'textLight',
          type: 'text',
          label: 'Texte secondaire',
          defaultValue: '#B8B5AE',
          admin: {
            components: {
              Field: '@/components/admin/ColorPickerField#ColorPickerField',
            },
          },
        },
        {
          name: 'border',
          type: 'text',
          label: 'Bordures',
          defaultValue: '#2D2D4A',
          admin: {
            components: {
              Field: '@/components/admin/ColorPickerField#ColorPickerField',
            },
          },
        },
      ],
    },
    {
      name: 'typography',
      type: 'group',
      label: 'Typographie',
      admin: {
        hidden: true,
        description: 'Polices de caracteres utilisees sur le site.',
      },
      fields: [
        {
          name: 'headingFont',
          type: 'select',
          label: 'Police des titres',
          defaultValue: 'cormorant',
          admin: {
            components: {
              Field: '@/components/admin/FontPreviewField#FontPreviewField',
            },
          },
          options: [
            { label: 'Cormorant Garamond (elegant, serif)', value: 'cormorant' },
            { label: 'Playfair Display (classique, serif)', value: 'playfair' },
            { label: 'Libre Baskerville (traditionnel, serif)', value: 'baskerville' },
            { label: 'Montserrat (moderne, sans-serif)', value: 'montserrat' },
          ],
        },
        {
          name: 'bodyFont',
          type: 'select',
          label: 'Police du texte',
          defaultValue: 'montserrat',
          admin: {
            components: {
              Field: '@/components/admin/FontPreviewField#FontPreviewField',
            },
          },
          options: [
            { label: 'Montserrat (moderne, sans-serif)', value: 'montserrat' },
            { label: 'Open Sans (lisible, sans-serif)', value: 'opensans' },
            { label: 'Lato (epure, sans-serif)', value: 'lato' },
            { label: 'Source Sans Pro (neutre, sans-serif)', value: 'sourcesans' },
          ],
        },
      ],
    },
  ],
};
