/**
 * Sections des pages libres : données communes à l'admin (src/blocks) et au
 * rendu (src/components/sections). Aucun import de Payload ni de React ici.
 */

export type SectionBackground = 'auto' | 'page' | 'soft' | 'dark';
export type SectionWidth = 'auto' | 'narrow' | 'normal' | 'wide';
export type SectionSpacing = 'normal' | 'tight';

export type SectionSettings = {
  background?: SectionBackground | null;
  width?: SectionWidth | null;
  spacing?: SectionSpacing | null;
  anchor?: string | null;
  hidden?: boolean | null;
};

export type SectionBlock = {
  id?: string | null;
  blockType: string;
  variant?: string | null;
  settings?: SectionSettings | null;
  [key: string]: unknown;
};

type LexicalNode = { type?: string; text?: string; children?: LexicalNode[] };

/** Vrai si un texte riche Lexical contient autre chose qu'un paragraphe vide. */
export function hasRichText(value: unknown): boolean {
  const root = (value as { root?: LexicalNode } | null)?.root;
  if (!root) return false;
  const walk = (node: LexicalNode): boolean => {
    if (typeof node.text === 'string' && node.text.trim().length > 0) return true;
    if (node.type && !['root', 'paragraph', 'text', 'linebreak'].includes(node.type)) return true;
    return Array.isArray(node.children) && node.children.some(walk);
  };
  return walk(root);
}

/**
 * Les sections à afficher. Une page d'avant les sections (champ `content`
 * seul) passe par une section « Texte » équivalente : même rendu avant et
 * après la reprise, et une ancienne version restaurée s'affiche encore.
 */
export function resolveSections(doc: { layout?: unknown; content?: unknown } | null | undefined): SectionBlock[] {
  const layout = Array.isArray(doc?.layout) ? (doc!.layout as SectionBlock[]) : [];
  const valid = layout.filter((block) => block && typeof block.blockType === 'string');
  if (valid.length > 0) return valid;
  if (hasRichText(doc?.content)) {
    return [{ id: 'ancien-contenu', blockType: 'text', content: doc!.content, variant: 'plain' }];
  }
  return [];
}

/** Fond et largeur d'origine de chaque type de section (réglage « Automatique »). */
const DEFAULTS: Record<string, { background: Exclude<SectionBackground, 'auto'>; width: Exclude<SectionWidth, 'auto'> }> = {
  text: { background: 'page', width: 'narrow' },
  quote: { background: 'dark', width: 'normal' },
  'quote:margin': { background: 'page', width: 'narrow' },
  mediaText: { background: 'page', width: 'wide' },
  columns: { background: 'page', width: 'normal' },
  gallery: { background: 'page', width: 'wide' },
  video: { background: 'page', width: 'normal' },
  cta: { background: 'dark', width: 'narrow' },
  'cta:inline': { background: 'soft', width: 'normal' },
  concerts: { background: 'page', width: 'normal' },
};

export function sectionLook(block: SectionBlock) {
  const base = DEFAULTS[`${block.blockType}:${block.variant}`] ?? DEFAULTS[block.blockType] ?? { background: 'page', width: 'normal' };
  const s = block.settings ?? {};
  const background = s.background && s.background !== 'auto' ? s.background : base.background;
  const width = s.width && s.width !== 'auto' ? s.width : base.width;
  const spacing = s.spacing === 'tight' ? 'tight' : 'normal';
  const anchor = typeof s.anchor === 'string' && s.anchor.trim() ? s.anchor.trim() : undefined;
  return {
    background,
    width,
    spacing,
    anchor,
    hidden: Boolean(s.hidden),
    className: [
      'lcs-section',
      `lcs-section--${block.blockType}`,
      block.variant ? `lcs-section--${block.blockType}-${block.variant}` : '',
      `lcs-section--bg-${background}`,
      `lcs-section--w-${width}`,
      `lcs-section--sp-${spacing}`,
    ]
      .filter(Boolean)
      .join(' '),
  };
}

/** Nom affiché d'un type de section (étiquettes de l'admin, aperçu). */
export const SECTION_NAMES: Record<string, string> = {
  text: 'Texte',
  quote: 'Citation',
  columns: 'Colonnes',
  mediaText: 'Texte + image',
  gallery: 'Photos',
  video: 'Vidéo',
  cta: 'Appel à l’action',
  concerts: 'Concerts',
};

/** Vrai si la page contient une section « Concerts » qui liste les prochaines dates. */
export function needsUpcomingConcerts(sections: SectionBlock[]): number {
  return sections
    .filter((s) => s.blockType === 'concerts' && s.source !== 'selected' && !s.settings?.hidden)
    .reduce((max, s) => Math.max(max, typeof s.limit === 'number' ? s.limit : 6), 0);
}
