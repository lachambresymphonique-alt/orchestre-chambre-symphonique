import { Fragment, type ReactNode } from 'react';

/**
 * Texte enrichi des champs « zone de texte » de l'admin.
 *
 * Le contenu reste une chaîne en base (aucune migration) ; l'éditeur de
 * l'admin (components/admin/RichTextField) l'écrit dans ce format, et le site
 * le relit ici :
 *
 *   ligne vide          → nouveau paragraphe
 *   retour simple       → retour à la ligne dans le paragraphe
 *   « ## » en début     → titre ; « ### » → sous-titre
 *   « - » en début      → liste à puces (une ligne par puce)
 *   *mot*  **mot**      → italique, gras (***mot*** : les deux)
 *   \*                  → astérisque affiché tel quel
 *
 * Les valeurs saisies avant l'éditeur (texte brut, `*italique*` des titres)
 * se lisent sans changement ; un astérisque orphelin reste affiché.
 */

export type Span = { text: string; bold: boolean; italic: boolean } | { br: true };

export type Block =
  | { type: 'paragraph'; content: Span[] }
  | { type: 'heading'; level: 2 | 3; content: Span[] }
  | { type: 'list'; items: Span[][] };

type Token =
  | { kind: 'text'; text: string }
  | { kind: 'br' }
  | { kind: 'mark'; bold: boolean; italic: boolean };

/** Découpe une ligne logique en texte, retours et marques d'emphase. */
function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let text = '';
  const flush = () => {
    if (text) tokens.push({ kind: 'text', text });
    text = '';
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '\\' && src[i + 1] === '*') {
      text += '*';
      i++;
    } else if (ch === '\n') {
      flush();
      tokens.push({ kind: 'br' });
    } else if (ch === '*') {
      let j = i;
      while (src[j] === '*') j++;
      const run = src.slice(i, j);
      flush();
      // * italique, ** gras, *** les deux ; au-delà, rien de sensé : littéral.
      if (run.length <= 3) {
        tokens.push({ kind: 'mark', bold: run.length >= 2, italic: run.length !== 2 });
      } else {
        text += run;
      }
      i = j - 1;
    } else {
      text += ch;
    }
  }
  flush();
  return tokens;
}

/**
 * Gras et italique d'un paragraphe. Chaque marque bascule un style ; une
 * marque qui n'est jamais refermée redevient du texte (« Prix* », « 5 * 3 »).
 */
export function parseInline(src: string): Span[] {
  const tokens = tokenize(src);
  const open: { bold: number; italic: number } = { bold: -1, italic: -1 };
  tokens.forEach((token, i) => {
    if (token.kind !== 'mark') return;
    for (const style of ['bold', 'italic'] as const) {
      if (!token[style]) continue;
      open[style] = open[style] === -1 ? i : -1;
    }
  });
  // De la fin vers le début : une insertion ne décale pas l'autre marque.
  const unmatched = (['bold', 'italic'] as const)
    .filter((style) => open[style] !== -1)
    .sort((a, b) => open[b] - open[a]);
  for (const style of unmatched) {
    const i = open[style];
    const token = tokens[i] as Extract<Token, { kind: 'mark' }>;
    token[style] = false;
    tokens.splice(i + 1, 0, { kind: 'text', text: style === 'bold' ? '**' : '*' });
  }

  const spans: Span[] = [];
  let bold = false;
  let italic = false;
  for (const token of tokens) {
    if (token.kind === 'mark') {
      if (token.bold) bold = !bold;
      if (token.italic) italic = !italic;
    } else if (token.kind === 'br') {
      spans.push({ br: true });
    } else {
      const last = spans[spans.length - 1];
      if (last && !('br' in last) && last.bold === bold && last.italic === italic) {
        last.text += token.text;
      } else {
        spans.push({ text: token.text, bold, italic });
      }
    }
  }
  return spans;
}

const HEADING = /^(#{2,3})\s+/;
const BULLET = /^[-•]\s+/;

/** Paragraphes, titres et listes d'un texte enrichi. */
export function parseBlocks(src: string | null | undefined): Block[] {
  const blocks: Block[] = [];
  const chunks = (src || '').replace(/\r\n?/g, '\n').split(/\n[ \t]*\n/);
  for (const raw of chunks) {
    const chunk = raw.trim();
    if (!chunk) continue;
    const lines = chunk.split('\n');
    const heading = lines[0].match(HEADING);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length === 2 ? 2 : 3,
        content: parseInline(chunk.slice(heading[0].length)),
      });
    } else if (BULLET.test(lines[0])) {
      // Une ligne sans tiret prolonge la puce précédente.
      const items: string[] = [];
      for (const line of lines) {
        if (BULLET.test(line) || items.length === 0) items.push(line.replace(BULLET, ''));
        else items[items.length - 1] += `\n${line}`;
      }
      blocks.push({ type: 'list', items: items.map(parseInline) });
    } else {
      blocks.push({ type: 'paragraph', content: parseInline(chunk) });
    }
  }
  return blocks;
}

/** Le texte sans ses marques : balises meta, données structurées, extraits. */
export function toPlainText(src: string | null | undefined): string {
  return parseBlocks(src)
    .map((block) => {
      const line = (spans: Span[]) => spans.map((s) => ('br' in s ? ' ' : s.text)).join('');
      if (block.type === 'list') return block.items.map(line).join(' ; ');
      return line(block.content);
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderSpans(spans: Span[]): ReactNode[] {
  return spans.map((span, i) => {
    if ('br' in span) return <br key={i} />;
    let node: ReactNode = span.text;
    if (span.italic) node = <em>{node}</em>;
    if (span.bold) node = <strong>{node}</strong>;
    return <Fragment key={i}>{node}</Fragment>;
  });
}

/**
 * Gras, italique et retours à la ligne, à poser dans un élément existant
 * (`<p>`, `<h2>`, `<blockquote>`…) : titres, phrases d'introduction, citations.
 * Les lignes vides d'un ancien texte deviennent un simple saut de ligne.
 */
export function renderInline(src: string | null | undefined): ReactNode[] {
  return renderSpans(parseInline((src || '').replace(/\r\n?/g, '\n').replace(/\n[ \t]*\n+/g, '\n\n').trim()));
}

type RichTextProps = {
  text: string | null | undefined;
  /** Premier paragraphe en exergue (`data-lead`), comme les chapeaux du site. */
  lead?: boolean;
  /** Niveau HTML du « Titre » ; le « Sous-titre » prend le suivant. */
  headingLevel?: 2 | 3 | 4;
};

/**
 * Les blocs d'un texte enrichi, à poser dans un conteneur qui règle déjà
 * l'espacement de ses paragraphes (`.about-intro__prose`, `.rich-text`…).
 */
export function RichText({ text, lead = false, headingLevel = 3 }: RichTextProps) {
  const blocks = parseBlocks(text);
  let paragraphIndex = 0;
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          const level = Math.min(headingLevel + (block.level - 2), 6);
          const Tag = `h${level}` as 'h3';
          return (
            <Tag key={i} className={block.level === 2 ? 'rich-text__title' : 'rich-text__subtitle'}>
              {renderSpans(block.content)}
            </Tag>
          );
        }
        if (block.type === 'list') {
          return (
            <ul key={i} className="rich-text__list">
              {block.items.map((item, j) => (
                <li key={j}>{renderSpans(item)}</li>
              ))}
            </ul>
          );
        }
        const isLead = lead && paragraphIndex === 0;
        paragraphIndex++;
        return (
          <p key={i} data-lead={isLead ? 'true' : undefined}>
            {renderSpans(block.content)}
          </p>
        );
      })}
    </>
  );
}
