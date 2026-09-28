'use client';

import './admin-sections.css';
import { useRowLabel } from '@payloadcms/ui';
import { SECTION_NAMES } from '@/lib/sections';
import { toPlainText } from '@/lib/richText';

export type Row = Record<string, unknown> & { blockType?: string; settings?: { hidden?: boolean } };

type LexicalNode = { text?: string; children?: LexicalNode[] };

/** Premier texte d'un contenu Lexical. */
function firstText(value: unknown): string {
  const walk = (node: LexicalNode | undefined): string => {
    if (!node) return '';
    if (typeof node.text === 'string' && node.text.trim()) return node.text;
    for (const child of node.children ?? []) {
      const found = walk(child);
      if (found) return found;
    }
    return '';
  };
  return walk((value as { root?: LexicalNode } | null)?.root);
}

const count = (value: unknown) => (Array.isArray(value) ? value.length : 0);
const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

function excerptOf(row: Row): string {
  const title = toPlainText(typeof row.title === 'string' ? row.title : '');
  switch (row.blockType) {
    case 'text':
      return title || firstText(row.content);
    case 'quote':
      return toPlainText(typeof row.quote === 'string' ? row.quote : '');
    case 'mediaText':
      return title || toPlainText(typeof row.text === 'string' ? row.text : '');
    case 'columns':
      return [title, count(row.items) ? plural(count(row.items), 'colonne', 'colonnes') : ''].filter(Boolean).join(' · ');
    case 'gallery':
      return [title, count(row.images) ? plural(count(row.images), 'photo', 'photos') : ''].filter(Boolean).join(' · ');
    case 'video':
      return title || (typeof row.url === 'string' ? row.url : '');
    case 'cta':
      return title;
    case 'concerts':
      return [
        title,
        row.source === 'selected' ? plural(count(row.concerts), 'concert choisi', 'concerts choisis') : 'prochains concerts',
      ]
        .filter(Boolean)
        .join(' · ');
    default:
      return title;
  }
}

type SummaryProps = { data: Row | null | undefined; index: number };

/** Numéro, type, début du contenu et « Masquée » : une section en une ligne. */
export function SectionSummary({ data, index }: SummaryProps) {
  const name = SECTION_NAMES[String(data?.blockType ?? '')] ?? 'Section';
  const raw = excerptOf(data ?? {});
  const excerpt = raw.length > 70 ? `${raw.slice(0, 70).trimEnd()}…` : raw;

  return (
    <span className="lcs-srow">
      <span className="lcs-srow__num">{String(index + 1).padStart(2, '0')}</span>
      <span className="lcs-srow__type">{name}</span>
      {excerpt ? <span className="lcs-srow__excerpt">{excerpt}</span> : <span className="lcs-srow__excerpt lcs-srow__excerpt--empty">à remplir</span>}
      {data?.settings?.hidden ? <span className="lcs-srow__badge">Masquée</span> : null}
    </span>
  );
}

/**
 * En-tête d'une section dans le champ blocs de Payload (masqué dans les
 * Pages, où SectionsField montre son propre plan, mais utilisé ailleurs :
 * versions, champ nu).
 */
export function SectionRowLabel() {
  const { data, rowNumber } = useRowLabel<Row>();
  return <SectionSummary data={data} index={rowNumber ?? 0} />;
}

export default SectionRowLabel;
