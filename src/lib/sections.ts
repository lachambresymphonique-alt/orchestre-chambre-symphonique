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

/** La section « Texte » qui reprend l'ancien contenu d'une page d'avant les sections. */
function legacyTextSection(content: unknown): SectionBlock {
  return {
    id: 'ancien-contenu',
    blockType: 'text',
    content,
    variant: 'plain',
    settings: { background: 'auto', width: 'auto', spacing: 'normal', hidden: false },
  };
}

/**
 * Les sections d'une page. Une page d'avant les sections (champ `content`
 * seul) reçoit une section « Texte » qui porte son ancien contenu : à la
 * lecture dans l'admin (hook afterRead de Pages.layout), on la voit et on la
 * modifie comme les autres, et le rendu est le même qu'avant. Vaut aussi pour
 * une ancienne version restaurée.
 */
export function withLegacyContent(layout: unknown, content: unknown): unknown {
  if (Array.isArray(layout) && layout.length > 0) return layout;
  if (hasRichText(content)) return [legacyTextSection(content)];
  return layout ?? [];
}

/** Les sections à afficher (mêmes règles que withLegacyContent). */
export function resolveSections(doc: { layout?: unknown; content?: unknown } | null | undefined): SectionBlock[] {
  const layout = withLegacyContent(doc?.layout, doc?.content);
  return (Array.isArray(layout) ? (layout as SectionBlock[]) : []).filter(
    (block) => block && typeof block.blockType === 'string',
  );
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
