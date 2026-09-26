import { toPlainText } from '@/lib/richText';

type Props = { cellData?: unknown };

/**
 * Colonne d'une liste de l'admin pour un champ mis en forme : le texte seul,
 * sans les astérisques ni les « ## » du format enregistré.
 */
export function RichTextCell({ cellData }: Props) {
  const text = typeof cellData === 'string' ? toPlainText(cellData) : '';
  if (!text) return <span>—</span>;
  return <span>{text.length > 140 ? `${text.slice(0, 140).trimEnd()}…` : text}</span>;
}
