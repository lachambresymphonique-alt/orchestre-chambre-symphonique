import { $createListItemNode, $createListNode, $isListItemNode, $isListNode, type ListNode } from '@lexical/list';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  $isLineBreakNode,
  $isTextNode,
  type ElementNode,
  type LexicalNode,
} from 'lexical';
import { parseBlocks, parseInline, type Span } from '@/lib/richText';
import type { RichTextVariant } from '@/lib/richTextAdmin';

/**
 * Passage entre la chaîne enregistrée (format de lib/richText) et l'état de
 * l'éditeur Lexical de components/admin/RichTextField. À appeler dans une
 * mise à jour (`$load`) ou une lecture (`$serialize`) de l'éditeur.
 */

export const IS_BOLD = 1;
export const IS_ITALIC = 2;

// ── Chaîne → éditeur ────────────────────────────────────────────────────────

function $appendSpans(parent: ElementNode, spans: Span[]) {
  for (const span of spans) {
    if ('br' in span) {
      parent.append($createLineBreakNode());
    } else if (span.text) {
      const node = $createTextNode(span.text);
      node.setFormat((span.bold ? IS_BOLD : 0) | (span.italic ? IS_ITALIC : 0));
      parent.append(node);
    }
  }
}

export function $load(value: string, variant: RichTextVariant) {
  const root = $getRoot();
  root.clear();
  const text = value.replace(/\r\n?/g, '\n');
  if (variant === 'prose') {
    for (const block of parseBlocks(text)) {
      if (block.type === 'heading') {
        const heading = $createHeadingNode(block.level === 2 ? 'h2' : 'h3');
        $appendSpans(heading, block.content);
        root.append(heading);
      } else if (block.type === 'list') {
        const list = $createListNode('bullet');
        for (const item of block.items) {
          const li = $createListItemNode();
          $appendSpans(li, item);
          list.append(li);
        }
        root.append(list);
      } else {
        const p = $createParagraphNode();
        $appendSpans(p, block.content);
        root.append(p);
      }
    }
  } else if (variant === 'lines') {
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      const p = $createParagraphNode();
      $appendSpans(p, parseInline(line.trim()));
      root.append(p);
    }
  } else {
    const p = $createParagraphNode();
    const src = variant === 'title' ? text.replace(/\s*\n\s*/g, ' ') : text.replace(/\n[ \t]*\n+/g, '\n\n');
    $appendSpans(p, parseInline(src.trim()));
    root.append(p);
  }
  if (root.getChildrenSize() === 0) root.append($createParagraphNode());
}

// ── Éditeur → chaîne ────────────────────────────────────────────────────────

/** Gras/italique d'un bloc : chaque changement de style pose une marque. */
function $inlineOf(element: ElementNode): string {
  let out = '';
  let bold = false;
  let italic = false;
  const mark = (nextBold: boolean, nextItalic: boolean) => {
    const toggleBold = nextBold !== bold;
    const toggleItalic = nextItalic !== italic;
    if (toggleBold && toggleItalic) out += '***';
    else if (toggleBold) out += '**';
    else if (toggleItalic) out += '*';
    bold = nextBold;
    italic = nextItalic;
  };
  const walk = (node: LexicalNode) => {
    if ($isLineBreakNode(node)) {
      // Marques refermées avant le retour : une ligne ne commence pas par « ** ».
      mark(false, false);
      out += '\n';
    } else if ($isTextNode(node)) {
      const text = node.getTextContent();
      if (!text) return;
      mark(node.hasFormat('bold'), node.hasFormat('italic'));
      out += text.replace(/\*/g, '\\*');
    } else if ($isElementNode(node)) {
      node.getChildren().forEach(walk);
    } else {
      out += node.getTextContent();
    }
  };
  element.getChildren().forEach(walk);
  mark(false, false);
  return out.trim();
}

function $listLines(list: ListNode, out: string[]) {
  for (const item of list.getChildren()) {
    if (!$isListItemNode(item)) continue;
    // Liste collée depuis ailleurs avec des sous-niveaux : tout à plat.
    const nested = item.getChildren().filter($isListNode);
    if (nested.length > 0 && nested.length === item.getChildrenSize()) {
      nested.forEach((child) => $listLines(child, out));
      continue;
    }
    const text = $inlineOf(item).replace(/\n+/g, '\n');
    if (text) out.push(`- ${text}`);
  }
}

export function $serialize(variant: RichTextVariant): string {
  const root = $getRoot();
  if (variant === 'prose') {
    const blocks: string[] = [];
    for (const block of root.getChildren()) {
      if ($isListNode(block)) {
        const lines: string[] = [];
        $listLines(block, lines);
        if (lines.length) blocks.push(lines.join('\n'));
        continue;
      }
      if (!$isElementNode(block)) continue;
      // Deux retours de suite dans un paragraphe en feraient deux.
      const text = $inlineOf(block).replace(/\n{2,}/g, '\n');
      if (!text) continue;
      if ($isHeadingNode(block)) {
        blocks.push(`${block.getTag() === 'h2' ? '##' : '###'} ${text}`);
      } else {
        // Un paragraphe qui commence par « ## » ou « - » reste un paragraphe.
        blocks.push(/^(#{2,3}\s|[-•]\s)/.test(text) ? `\\${text}` : text);
      }
    }
    return blocks.join('\n\n');
  }
  const paragraphs = root
    .getChildren()
    .filter($isElementNode)
    .map((p) => $inlineOf(p));
  if (variant === 'lines') {
    return paragraphs
      .flatMap((p) => p.split('\n'))
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n');
  }
  if (variant === 'title') return paragraphs.join(' ').replace(/\s+/g, ' ').trim();
  return paragraphs.filter(Boolean).join('\n');
}
