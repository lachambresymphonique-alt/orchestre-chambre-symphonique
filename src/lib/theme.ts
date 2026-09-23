/**
 * Apparence du site — réglages de « Réglages → Apparence du site ».
 *
 * Un seul module, sans dépendance serveur, partagé par :
 *  - le layout du site (variables posées sur <html> au rendu serveur) ;
 *  - ThemeLive (les mêmes variables, recalculées à chaque frappe dans l'aperçu) ;
 *  - les champs de l'admin (catalogue, valeurs par défaut, aperçus).
 *
 * Principe : un réglage vide (null) garde le dessin d'origine du site. Seules
 * les valeurs choisies produisent une variable CSS ; globals.css porte les
 * valeurs d'origine.
 */

// ─── Polices ─────────────────────────────────────────────────────────────────

export type FontRole = 'h1' | 'h2' | 'h3' | 'body' | 'ui';

export type FontOption = {
  key: string;
  label: string;
  /** Variable posée par next/font dans le layout du site. */
  cssVar: string;
  /** Famille Google Fonts (aperçus de l'admin). */
  family: string;
  /** Pile de repli après la police. */
  fallback: string;
  /** Rôles où cette police est proposée. */
  roles: FontRole[];
  hint: string;
  /** Fraunces sans arrondi : même police, empattements nets. */
  sharp?: boolean;
  /** Linéale (sans empattements) : rangée à part dans l'admin. */
  sans?: boolean;
};

const SERIF_DISPLAY_FALLBACK = "'Tiempos Headline', Georgia, serif";
const SERIF_TEXT_FALLBACK = "'Tiempos', Georgia, serif";
const SANS_FALLBACK = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";

const HEADINGS: FontRole[] = ['h1', 'h2', 'h3'];

export const FONT_OPTIONS: FontOption[] = [
  {
    key: 'fraunces-soft',
    label: 'Fraunces arrondi',
    cssVar: '--font-fraunces',
    family: 'Fraunces',
    fallback: SERIF_DISPLAY_FALLBACK,
    roles: HEADINGS,
    hint: 'Le dessin d’origine du site, aux empattements arrondis.',
  },
  {
    key: 'fraunces-sharp',
    label: 'Fraunces affûté',
    cssVar: '--font-fraunces',
    family: 'Fraunces',
    fallback: SERIF_DISPLAY_FALLBACK,
    roles: HEADINGS,
    sharp: true,
    hint: 'La même police, arrondi supprimé : un dessin fin et net.',
  },
  {
    key: 'bodoni',
    label: 'Bodoni Moda',
    cssVar: '--font-bodoni',
    family: 'Bodoni Moda',
    fallback: SERIF_DISPLAY_FALLBACK,
    roles: HEADINGS,
    hint: 'Contrastée, comme les pages de titre des partitions anciennes.',
  },
  {
    key: 'ibarra',
    label: 'Ibarra Real Nova',
    cssVar: '--font-ibarra',
    family: 'Ibarra Real Nova',
    fallback: SERIF_DISPLAY_FALLBACK,
    roles: [...HEADINGS, 'body'],
    hint: 'Chaleureuse et littéraire, inspirée des livres du XVIIIe siècle.',
  },
  {
    key: 'cormorant',
    label: 'Cormorant Garamond',
    cssVar: '--font-cormorant',
    family: 'Cormorant Garamond',
    fallback: SERIF_DISPLAY_FALLBACK,
    roles: HEADINGS,
    hint: 'Garamond de titrage, très fin et élancé. Aime les grandes tailles.',
  },
  {
    key: 'playfair',
    label: 'Playfair Display',
    cssVar: '--font-playfair',
    family: 'Playfair Display',
    fallback: SERIF_DISPLAY_FALLBACK,
    roles: HEADINGS,
    hint: 'Contraste marqué et italique généreuse : élégante et affirmée.',
  },
  {
    key: 'ebgaramond',
    label: 'EB Garamond',
    cssVar: '--font-ebgaramond',
    family: 'EB Garamond',
    fallback: SERIF_TEXT_FALLBACK,
    roles: [...HEADINGS, 'body'],
    hint: 'Le Garamond classique, sobre et lisible : titres calmes ou texte.',
  },
  {
    key: 'sourceserif',
    label: 'Source Serif',
    cssVar: '--font-source-serif',
    family: 'Source Serif 4',
    fallback: SERIF_TEXT_FALLBACK,
    roles: ['body'],
    hint: 'Le texte d’origine du site : un serif de lecture net et régulier.',
  },
  {
    key: 'lora',
    label: 'Lora',
    cssVar: '--font-lora',
    family: 'Lora',
    fallback: SERIF_TEXT_FALLBACK,
    roles: ['body'],
    hint: 'Serif doux aux courbes calligraphiques, confortable en paragraphe.',
  },
  // ── Linéales (sans empattements) ──
  {
    key: 'inter',
    label: 'Inter',
    cssVar: '--font-inter',
    family: 'Inter',
    fallback: SANS_FALLBACK,
    roles: [...HEADINGS, 'body', 'ui'],
    sans: true,
    hint: 'Linéale neutre et très lisible. L’interface d’origine du site.',
  },
  {
    key: 'lato',
    label: 'Lato',
    cssVar: '--font-lato',
    family: 'Lato',
    fallback: SANS_FALLBACK,
    roles: [...HEADINGS, 'body', 'ui'],
    sans: true,
    hint: 'Linéale chaleureuse aux formes semi-rondes : claire sans être froide.',
  },
  {
    key: 'montserrat',
    label: 'Montserrat',
    cssVar: '--font-montserrat',
    family: 'Montserrat',
    fallback: SANS_FALLBACK,
    roles: [...HEADINGS, 'body', 'ui'],
    sans: true,
    hint: 'Géométrique et large, inspirée des affiches : du caractère dans les titres.',
  },
  {
    key: 'raleway',
    label: 'Raleway',
    cssVar: '--font-raleway',
    family: 'Raleway',
    fallback: SANS_FALLBACK,
    roles: [...HEADINGS, 'body', 'ui'],
    sans: true,
    hint: 'Fine et élégante, très belle en grands titres légers.',
  },
  {
    key: 'josefin',
    label: 'Josefin Sans',
    cssVar: '--font-josefin',
    family: 'Josefin Sans',
    fallback: SANS_FALLBACK,
    roles: [...HEADINGS, 'ui'],
    sans: true,
    hint: 'Géométrique aux accents années 1920, rétro et raffinée. Plutôt pour les titres.',
  },
  {
    key: 'jost',
    label: 'Jost',
    cssVar: '--font-jost',
    family: 'Jost',
    fallback: SANS_FALLBACK,
    roles: [...HEADINGS, 'body', 'ui'],
    sans: true,
    hint: 'Dans l’esprit de Futura : nette, moderne, un rien Bauhaus.',
  },
  {
    key: 'dmsans',
    label: 'DM Sans',
    cssVar: '--font-dmsans',
    family: 'DM Sans',
    fallback: SANS_FALLBACK,
    roles: [...HEADINGS, 'body', 'ui'],
    sans: true,
    hint: 'Linéale géométrique, plus ronde et plus douce qu’Inter.',
  },
];

export const FONT_BY_KEY: Record<string, FontOption> = Object.fromEntries(
  FONT_OPTIONS.map((f) => [f.key, f]),
);

export type FontRoleInfo = {
  role: FontRole;
  field: 'fontH1' | 'fontH2' | 'fontH3' | 'fontBody' | 'fontUi';
  label: string;
  where: string;
  /** Police d'origine quand rien n'est choisi (les titres suivent l'ancien réglage unique). */
  fallback: string;
};

export const FONT_ROLES: FontRoleInfo[] = [
  {
    role: 'h1',
    field: 'fontH1',
    label: 'Titre 1 — titres de page',
    where: 'La bannière de l’accueil, le nom d’un musicien, le titre d’un article.',
    fallback: 'fraunces-soft',
  },
  {
    role: 'h2',
    field: 'fontH2',
    label: 'Titre 2 — titres de section',
    where: '« Prochains concerts », « Nos solistes », les intertitres, les citations et grands chiffres.',
    fallback: 'fraunces-soft',
  },
  {
    role: 'h3',
    field: 'fontH3',
    label: 'Titre 3 — titres de carte',
    where: 'Le nom d’un concert, d’un soliste, d’une formule de soutien, les dates des affiches.',
    fallback: 'fraunces-soft',
  },
  {
    role: 'body',
    field: 'fontBody',
    label: 'Paragraphes',
    where: 'Le texte courant : présentations, programmes, articles.',
    fallback: 'sourceserif',
  },
  {
    role: 'ui',
    field: 'fontUi',
    label: 'Texte d’interface',
    where: 'Menu, boutons, étiquettes en capitales, dates et lieux, formulaires.',
    fallback: 'inter',
  },
];

export const fontsForRole = (role: FontRole) => FONT_OPTIONS.filter((f) => f.roles.includes(role));

// ─── Couleurs ────────────────────────────────────────────────────────────────

export type ColorField =
  | 'colorHeadings'
  | 'colorText'
  | 'colorMuted'
  | 'colorAccent'
  | 'colorLink'
  | 'buttonBg'
  | 'buttonText'
  | 'buttonHover';

/**
 * Ambiance du site. En clair, les zones de lecture passent sur un papier crème
 * à l'encre brune ; les bandeaux encrés (en-tête, bannière, citation, lettre
 * d'information, pied de page, en-têtes de page et d'article) restent sombres,
 * parce qu'ils posent du texte clair sur des photos. Voir le bloc « THÈME »
 * de globals.css.
 */
export type ColorMode = 'dark' | 'light';

export const COLOR_MODES: { value: ColorMode; label: string; hint: string }[] = [
  { value: 'dark', label: 'Sombre', hint: 'La salle avant la première note : le dessin d’origine.' },
  {
    value: 'light',
    label: 'Clair',
    hint: 'Papier crème et encre brune ; les bandeaux sur photo restent sombres.',
  },
];

export const colorModeOf = (doc: { colorMode?: string | null } | null | undefined): ColorMode =>
  doc?.colorMode === 'light' ? 'light' : 'dark';

/** Fond des zones de lecture, selon l'ambiance (non réglable). */
export const PAGE_BACKGROUNDS: Record<ColorMode, string> = { dark: '#050302', light: '#faf6ef' };

/** Fond des bandeaux encrés, sombres dans les deux ambiances. */
export const BAND_BACKGROUND = '#050302';

export const pageBackground = (doc: { colorMode?: string | null } | null | undefined) =>
  PAGE_BACKGROUNDS[colorModeOf(doc)];

export type ColorInfo = {
  field: ColorField;
  label: string;
  where: string;
  /** Valeur d'origine de chaque ambiance, en hexadécimal (globals.css les définit). */
  fallback: Record<ColorMode, string>;
  /** Champ de fond contre lequel mesurer le contraste ; `page` = fond du site. */
  contrastWith?: ColorField | 'page';
};

export const COLORS: ColorInfo[] = [
  {
    field: 'colorHeadings',
    label: 'Titres',
    where: 'Titres de page, de section et de carte.',
    fallback: { dark: '#F9EDDD', light: '#1f1712' },
    contrastWith: 'page',
  },
  {
    field: 'colorText',
    label: 'Texte courant',
    where: 'Paragraphes et texte des articles.',
    fallback: { dark: '#E9DCCD', light: '#3b3028' },
    contrastWith: 'page',
  },
  {
    field: 'colorMuted',
    label: 'Texte discret',
    where: 'Étiquettes, dates, légendes, mentions.',
    fallback: { dark: '#A49589', light: '#76685c' },
    contrastWith: 'page',
  },
  {
    field: 'colorAccent',
    label: 'Accent',
    where: 'Filets, pastilles, soulignés du menu, lueurs des fonds, étiquette « Prochain concert ».',
    fallback: { dark: '#E34D00', light: '#c2410c' },
    contrastWith: 'page',
  },
  {
    field: 'colorLink',
    label: 'Liens et italiques',
    where: 'Liens fléchés, mots en italique des titres, lieux des concerts.',
    fallback: { dark: '#FAA038', light: '#a1480e' },
    contrastWith: 'page',
  },
  {
    field: 'buttonBg',
    label: 'Fond du bouton',
    where: 'Boutons pleins : « Réserver une place », envoi des formulaires, dons.',
    fallback: { dark: '#E34D00', light: '#c2410c' },
    contrastWith: 'page',
  },
  {
    field: 'buttonText',
    label: 'Texte du bouton',
    where: 'Le texte posé sur le fond du bouton.',
    fallback: { dark: '#050302', light: '#fff8f1' },
    contrastWith: 'buttonBg',
  },
  {
    field: 'buttonHover',
    label: 'Bouton au survol',
    where: 'Le fond du bouton quand la souris passe dessus.',
    fallback: { dark: '#FAA038', light: '#a1480e' },
    contrastWith: 'page',
  },
];

export const COLOR_BY_FIELD: Record<ColorField, ColorInfo> = Object.fromEntries(
  COLORS.map((c) => [c.field, c]),
) as Record<ColorField, ColorInfo>;

// ─── Boutons ─────────────────────────────────────────────────────────────────

export const BUTTON_STYLES = [
  { value: 'filled', label: 'Plein', hint: 'Fond coloré, le choix d’origine.' },
  { value: 'outline', label: 'Contour', hint: 'Un filet de couleur ; le fond se remplit au survol.' },
] as const;

export const BUTTON_SHAPES = [
  { value: 'square', label: 'Droits', radius: '0px', hint: 'Angles vifs, le dessin d’origine.' },
  { value: 'soft', label: 'Adoucis', radius: '4px', hint: 'Une pointe d’arrondi.' },
  { value: 'rounded', label: 'Arrondis', radius: '12px', hint: 'Coins nettement arrondis.' },
  { value: 'pill', label: 'Pilule', radius: '999px', hint: 'Extrémités entièrement rondes.' },
] as const;

export type ButtonStyle = (typeof BUTTON_STYLES)[number]['value'];
export type ButtonShape = (typeof BUTTON_SHAPES)[number]['value'];

// ─── Document ────────────────────────────────────────────────────────────────

export type ThemeDoc = {
  /** Ambiance : « light » ou vide (sombre, l'origine). */
  colorMode?: string | null;
  /** Ancien réglage unique (tous les titres) : valeur par défaut de H1, H2, H3. */
  displayFont?: string | null;
  fontH1?: string | null;
  fontH2?: string | null;
  fontH3?: string | null;
  fontBody?: string | null;
  fontUi?: string | null;
  buttonStyle?: string | null;
  buttonShape?: string | null;
} & Partial<Record<ColorField, string | null>>;

/** Tous les champs réglables, pour « Revenir au dessin d'origine ». */
export const THEME_FIELDS = [
  'colorMode',
  ...FONT_ROLES.map((r) => r.field),
  ...COLORS.map((c) => c.field),
  'buttonStyle',
  'buttonShape',
] as const;

// ─── Couleurs : lecture, contraste ───────────────────────────────────────────

/** « #abc », « abc », « #AABBCC » → « #aabbcc » ; sinon null. */
export function normalizeHex(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  let v = value.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(v)) v = v.split('').map((c) => c + c).join('');
  return /^[0-9a-f]{6}$/i.test(v) ? `#${v.toLowerCase()}` : null;
}

function luminance(hex: string): number {
  const n = normalizeHex(hex);
  if (!n) return 0;
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapport de contraste WCAG entre deux couleurs (1 à 21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Valeur choisie, ou valeur d'origine de l'ambiance. */
export function effectiveColor(doc: ThemeDoc | null | undefined, field: ColorField): string {
  return normalizeHex(doc?.[field]) ?? COLOR_BY_FIELD[field].fallback[colorModeOf(doc)];
}

// ─── Résolution ──────────────────────────────────────────────────────────────

/** Police effective d'un rôle : le choix, sinon l'ancien réglage (titres), sinon l'origine. */
export function effectiveFont(doc: ThemeDoc | null | undefined, role: FontRole): FontOption {
  const info = FONT_ROLES.find((r) => r.role === role)!;
  const chosen = doc?.[info.field];
  if (typeof chosen === 'string' && FONT_BY_KEY[chosen]?.roles.includes(role)) return FONT_BY_KEY[chosen];
  if (role === 'h1' || role === 'h2' || role === 'h3') {
    const legacy = doc?.displayFont;
    if (typeof legacy === 'string' && FONT_BY_KEY[legacy]?.roles.includes(role)) return FONT_BY_KEY[legacy];
  }
  return FONT_BY_KEY[info.fallback];
}

export const fontStack = (font: FontOption) => `var(${font.cssVar}), '${font.family}', ${font.fallback}`;

/** Pile CSS pour les aperçus de l'admin (familles Google Fonts, pas de variable next/font). */
export const adminFontStack = (font: FontOption) => `'${font.family}', ${font.fallback}`;

export type ResolvedTheme = {
  /** Variables CSS à poser sur <html>. */
  vars: Record<string, string>;
  /** Attributs de <html> lus par globals.css. */
  attrs: { 'data-display': string; 'data-buttons': ButtonStyle; 'data-mode': ColorMode };
};

/**
 * Réglages → variables CSS. Les polices sont toujours posées (elles valent
 * l'origine par défaut) ; les couleurs et la forme des boutons seulement quand
 * elles sont choisies.
 */
export function resolveTheme(doc: ThemeDoc | null | undefined): ResolvedTheme {
  const vars: Record<string, string> = {};

  for (const role of ['h1', 'h2', 'h3'] as const) {
    const font = effectiveFont(doc, role);
    vars[`--font-${role}`] = fontStack(font);
    // Fraunces affûté : l'axe « SOFT » tombe à 0 pour ce niveau de titre seulement.
    if (font.sharp) vars[`--soft-${role}`] = '0';
  }
  vars['--font-body-serif'] = fontStack(effectiveFont(doc, 'body'));
  vars['--font-body'] = fontStack(effectiveFont(doc, 'ui'));

  const set = (field: ColorField, ...names: string[]) => {
    const hex = normalizeHex(doc?.[field]);
    if (hex) for (const n of names) vars[n] = hex;
    return hex;
  };
  const mode = colorModeOf(doc);
  // En sombre, les bandeaux encrés partagent les couleurs du texte (« on-bordeaux ») ;
  // en clair ils gardent leur texte clair d'origine, quelles que soient les encres choisies.
  const dark = mode === 'dark';
  const headings = set('colorHeadings', '--bordeaux', ...(dark ? ['--on-bordeaux'] : []));
  set('colorText', '--bordeaux-deep');
  set('colorMuted', '--rose-mute', ...(dark ? ['--on-bordeaux-mute'] : []));
  set('colorAccent', '--velvet');
  const link = set('colorLink', '--bordeaux-bright');
  if (link && dark) {
    // Lueur dorée des fonds et des filets clairs : entre le lien et les titres.
    vars['--on-bordeaux-glow'] = `color-mix(in oklch, ${link} 65%, ${headings ?? COLOR_BY_FIELD.colorHeadings.fallback.dark})`;
  }
  set('buttonBg', '--btn-bg');
  // Le bouton de dons garde son texte clair d'origine tant que rien n'est choisi.
  set('buttonText', '--btn-ink', '--btn-ink-custom');
  set('buttonHover', '--btn-hover');

  const shape = BUTTON_SHAPES.find((s) => s.value === doc?.buttonShape);
  if (shape) vars['--btn-radius'] = shape.radius;

  const style: ButtonStyle = doc?.buttonStyle === 'outline' ? 'outline' : 'filled';

  return {
    vars,
    attrs: {
      // Réglages fins propres à une police (interlettrage du très grand titre).
      'data-display': effectiveFont(doc, 'h1').key,
      'data-buttons': style,
      'data-mode': mode,
    },
  };
}

// ─── Palettes prêtes à l'emploi ──────────────────────────────────────────────

type PresetColors = Partial<Record<ColorField, string | null>>;

export type ThemePreset = {
  key: string;
  label: string;
  hint: string;
  /** Une déclinaison par ambiance : un accent lisible sur fond sombre ne l'est pas sur papier. */
  values: Record<ColorMode, PresetColors>;
};

const ORIGIN: PresetColors = Object.fromEntries(COLORS.map((c) => [c.field, null]));

/** Accent, liens, bouton : les cinq couleurs qu'une palette fixe (les encres du texte restent). */
const palette = (accent: string, link: string, bg: string, ink: string, hover: string): PresetColors => ({
  ...ORIGIN,
  colorAccent: accent,
  colorLink: link,
  buttonBg: bg,
  buttonText: ink,
  buttonHover: hover,
});

export const COLOR_PRESETS: ThemePreset[] = [
  {
    key: 'origine',
    label: 'Braise & ambre',
    hint: 'Le dessin d’origine.',
    values: { dark: { ...ORIGIN }, light: { ...ORIGIN } },
  },
  {
    key: 'or',
    label: 'Or ancien',
    hint: 'Doré et feutré, comme les dorures d’une salle.',
    values: {
      dark: palette('#c9a84c', '#e8d48b', '#c9a84c', '#14100a', '#e8d48b'),
      light: palette('#9a7a22', '#7f6219', '#8a6d1f', '#fffaf0', '#6f5716'),
    },
  },
  {
    key: 'bordeaux',
    label: 'Velours bordeaux',
    hint: 'Rouge profond de fauteuil d’opéra.',
    values: {
      dark: palette('#b0283f', '#eaa2a0', '#b0283f', '#fbefea', '#d0485c'),
      light: palette('#9b1b30', '#8a1a2b', '#9b1b30', '#fff5f5', '#7a1424'),
    },
  },
  {
    key: 'cuivre',
    label: 'Cuivre',
    hint: 'Le métal des cors et des trompettes.',
    values: {
      dark: palette('#c9764a', '#e9b394', '#c9764a', '#140a05', '#e9b394'),
      light: palette('#a5532b', '#8f4622', '#a5532b', '#fff7f2', '#7c3c1d'),
    },
  },
  {
    key: 'nuit',
    label: 'Nuit bleue',
    hint: 'Bleu saphir, calme et nocturne.',
    values: {
      dark: palette('#5b7fd6', '#a9c1f5', '#5b7fd6', '#07101f', '#a9c1f5'),
      light: palette('#2c4f9e', '#264587', '#2c4f9e', '#f5f8ff', '#1f3a73'),
    },
  },
  {
    key: 'emeraude',
    label: 'Émeraude',
    hint: 'Vert profond, printanier.',
    values: {
      dark: palette('#2fa37a', '#8fd9bb', '#2fa37a', '#04140e', '#8fd9bb'),
      light: palette('#1d7a59', '#17654a', '#1d7a59', '#f2fbf7', '#145740'),
    },
  },
  {
    key: 'amethyste',
    label: 'Améthyste',
    hint: 'Violet d’encre, romantique.',
    values: {
      dark: palette('#a06ad8', '#d6b8f5', '#a06ad8', '#140a1f', '#d6b8f5'),
      light: palette('#6e3fa3', '#5d348c', '#6e3fa3', '#faf5ff', '#4f2c77'),
    },
  },
  {
    key: 'ivoire',
    label: 'Ivoire',
    hint: 'Sobre, presque monochrome.',
    values: {
      dark: palette('#cdbfa6', '#efe3cc', '#efe6d6', '#14100a', '#ffffff'),
      light: palette('#6b5e50', '#3b3028', '#1f1712', '#faf6ef', '#3b3028'),
    },
  },
];

/** La palette qui correspond exactement aux couleurs du formulaire, s'il y en a une. */
export function matchingPreset(doc: ThemeDoc | null | undefined, mode: ColorMode = colorModeOf(doc)) {
  return COLOR_PRESETS.find((p) =>
    COLORS.every((c) => (normalizeHex(p.values[mode][c.field]) ?? null) === (normalizeHex(doc?.[c.field]) ?? null)),
  );
}

// ─── Validation (champs de l'admin) ──────────────────────────────────────────

export const validateHex = (value: unknown): true | string =>
  value === null || value === undefined || value === '' || normalizeHex(value)
    ? true
    : 'Indiquez une couleur hexadécimale, par exemple #E34D00.';

export const validateFontFor =
  (role: FontRole) =>
  (value: unknown): true | string =>
    !value || (typeof value === 'string' && FONT_BY_KEY[value]?.roles.includes(role))
      ? true
      : 'Police inconnue pour ce niveau de texte.';

/** Feuille Google Fonts de toutes les polices du catalogue, pour les aperçus de l'admin. */
export const ADMIN_FONTS_HREF =
  'https://fonts.googleapis.com/css2?' +
  [
    'family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..600,0..100,0..1;1,9..144,300..600,0..100,0..1',
    'family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..600;1,6..96,400..600',
    'family=Ibarra+Real+Nova:ital,wght@0,400..600;1,400..600',
    'family=Cormorant+Garamond:ital,wght@0,400..600;1,400..600',
    'family=Playfair+Display:ital,wght@0,400..600;1,400..600',
    'family=EB+Garamond:ital,wght@0,400..600;1,400..600',
    'family=Source+Serif+4:ital,opsz,wght@0,8..60,400..600;1,8..60,400..600',
    'family=Lora:ital,wght@0,400..600;1,400..600',
    'family=Inter:wght@300..700',
    'family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700',
    'family=Lato:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700',
    'family=Montserrat:ital,wght@0,300..700;1,300..700',
    'family=Raleway:ital,wght@0,300..700;1,300..700',
    'family=Josefin+Sans:ital,wght@0,300..700;1,300..700',
    'family=Jost:ital,wght@0,300..700;1,300..700',
  ].join('&') +
  '&display=swap';
