import type { Field, GlobalConfig } from 'payload';
import {
  COLORS,
  FONT_ROLES,
  validateFontFor,
  validateHex,
  BUTTON_SHAPES,
  BUTTON_STYLES,
  type ColorField,
} from '../lib/theme';

/**
 * « Réglages → Apparence du site » : polices, couleurs et boutons du site.
 *
 * Trois onglets, un aperçu qui suit chaque réglage, et l'aperçu en direct du
 * site à droite. Un champ vide garde le dessin d'origine ; le catalogue, les
 * valeurs d'origine et la traduction en variables CSS sont dans
 * src/lib/theme.ts. Tous les champs sont du texte (pas d'énumération en base) :
 * ajouter une police ou une palette ne demande aucune migration.
 */

const FONT_FIELD = '@/components/admin/ThemeFontField#ThemeFontField';
const COLOR_FIELD = '@/components/admin/ThemeColorField#ThemeColorField';
const CHOICE_FIELD = '@/components/admin/ThemeChoiceField#ThemeChoiceField';
const SPECIMEN = '@/components/admin/ThemeSpecimen#ThemeSpecimen';
const SECTION = '@/components/admin/ThemeSection#ThemeSection';

const fontField = (info: (typeof FONT_ROLES)[number]): Field => ({
  name: info.field,
  type: 'text',
  label: info.label,
  validate: validateFontFor(info.role) as any,
  admin: { description: info.where, components: { Field: FONT_FIELD } },
});

const colorField = (field: ColorField): Field => {
  const info = COLORS.find((c) => c.field === field)!;
  return {
    name: field,
    type: 'text',
    label: info.label,
    validate: validateHex as any,
    admin: { description: info.where, components: { Field: COLOR_FIELD } },
  };
};

const section = (name: string, label: string, description: string): Field => ({
  name,
  type: 'ui',
  label,
  admin: { description, components: { Field: SECTION } } as any,
});

export const ThemeSettings: GlobalConfig = {
  slug: 'theme-settings',
  label: 'Apparence du site',
  admin: {
    group: 'Réglages',
    description:
      'Polices, couleurs et boutons du site. Chaque réglage se voit aussitôt dans l’aperçu à droite ; enregistrez pour publier. Un réglage laissé vide garde le dessin d’origine.',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Typographie',
          description:
            'Une police par niveau de texte. Les titres de page, de section et de carte peuvent se distinguer ou partager la même police.',
          fields: [
            { name: 'typeSpecimen', type: 'ui', admin: { components: { Field: SPECIMEN } } as any },
            section('typeHeadings', 'Titres', 'Du plus grand au plus petit.'),
            fontField(FONT_ROLES[0]),
            fontField(FONT_ROLES[1]),
            fontField(FONT_ROLES[2]),
            section('typeText', 'Texte', 'La lecture et l’interface.'),
            fontField(FONT_ROLES[3]),
            fontField(FONT_ROLES[4]),
            // Ancien réglage unique « Typographie des titres » : sert de valeur par
            // défaut aux trois niveaux de titre tant qu'ils ne sont pas choisis.
            // Type et options inchangés : la colonne est une énumération en base.
            {
              name: 'displayFont',
              type: 'radio',
              defaultValue: 'fraunces-soft',
              options: [
                { label: 'Ibarra Real Nova', value: 'ibarra' },
                { label: 'Bodoni Moda', value: 'bodoni' },
                { label: 'Fraunces affûté', value: 'fraunces-sharp' },
                { label: 'Fraunces arrondi (dessin d\'origine)', value: 'fraunces-soft' },
              ],
              admin: { hidden: true },
            },
          ],
        },
        {
          label: 'Couleurs',
          description:
            'L’ambiance, sombre ou claire, puis une palette et les couleurs une à une. Le contraste de chaque couleur est mesuré sur le fond où elle se pose.',
          fields: [
            { name: 'colorSpecimen', type: 'ui', admin: { components: { Field: SPECIMEN } } as any },
            {
              name: 'colorMode',
              type: 'text',
              label: 'Ambiance',
              validate: ((v: unknown) => (!v || v === 'light' || v === 'dark' ? true : 'Ambiance inconnue.')) as any,
              admin: { components: { Field: '@/components/admin/ThemeModeField#ThemeModeField' } },
            },
            {
              name: 'colorPresets',
              type: 'ui',
              label: 'Palettes',
              admin: {
                description: 'Un point de départ : la palette remplace les couleurs d’accent et de bouton, vous pouvez ensuite ajuster.',
                components: { Field: '@/components/admin/ThemePresets#ThemePresets' },
              } as any,
            },
            section('colorsText', 'Texte', 'Les trois tons du texte, du plus fort au plus discret.'),
            {
              type: 'row',
              fields: [colorField('colorHeadings'), colorField('colorText'), colorField('colorMuted')],
            },
            section('colorsAccents', 'Accents', 'Ce qui guide l’œil : filets, liens, mots en italique.'),
            { type: 'row', fields: [colorField('colorAccent'), colorField('colorLink')] },
          ],
        },
        {
          label: 'Boutons',
          description:
            'Les boutons d’action du site : « Réserver une place », l’envoi des formulaires, le don. Les liens fléchés suivent la couleur « Liens et italiques ».',
          fields: [
            { name: 'buttonSpecimen', type: 'ui', admin: { components: { Field: SPECIMEN } } as any },
            {
              name: 'buttonStyle',
              type: 'text',
              label: 'Style',
              validate: ((v: unknown) =>
                !v || BUTTON_STYLES.some((s) => s.value === v) ? true : 'Style inconnu.') as any,
              admin: { components: { Field: CHOICE_FIELD } },
            },
            {
              name: 'buttonShape',
              type: 'text',
              label: 'Forme des angles',
              validate: ((v: unknown) =>
                !v || BUTTON_SHAPES.some((s) => s.value === v) ? true : 'Forme inconnue.') as any,
              admin: { components: { Field: CHOICE_FIELD } },
            },
            section('buttonColors', 'Couleurs du bouton', 'Le fond, le texte posé dessus et le fond au survol.'),
            { type: 'row', fields: [colorField('buttonBg'), colorField('buttonText'), colorField('buttonHover')] },
          ],
        },
      ],
    },

    // ── Barre latérale : résumé et retour au dessin d'origine ────────────
    {
      name: 'themeSummary',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '@/components/admin/ThemeSummary#ThemeSummary' },
      } as any,
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
