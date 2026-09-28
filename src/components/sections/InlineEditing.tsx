'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { SectionMessage } from '@/lib/sections';

/**
 * Édition directe dans l'aperçu de l'admin, comme chez Shopify : un clic sur
 * un titre ou un texte marqué `data-lcs-edit="chemin.du.champ"` le rend
 * modifiable sur place, avec le style exact du site ; un clic sur une photo
 * marquée `data-lcs-image` ouvre la médiathèque dans l'admin.
 *
 * Le texte modifié est rendu au format des champs (`*italique*`, `**gras**`,
 * retour à la ligne, `## ` intertitre, `- ` liste : voir lib/richText) et
 * envoyé au formulaire de l'admin à la sortie du champ (Entrée, clic
 * ailleurs). En attendant que l'admin renvoie l'aperçu, la nouvelle valeur
 * est affichée tout de suite (useInlineOverrides), sans retour de l'ancienne.
 *
 * Pendant la saisie, l'élément contient une copie de son contenu : React
 * garde les nœuds d'origine, remis en place avant tout nouveau rendu.
 */

/** Ce qu'un champ accepte : texte seul, mot en italique d'accent, gras et italique, ou texte complet. */
export type InlineKind = 'plain' | 'title' | 'inline' | 'prose';

// ── Valeurs saisies ici, affichées avant le retour de l'admin ───────────────

type Override = { value: string; before: unknown };
const overrides = new Map<string, Override>();
const listeners = new Set<() => void>();
let version = 0;
// Dernières données reçues de l'admin (valeur d'un champ avant sa saisie ici).
let lastData: unknown;

function notify() {
  version++;
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

function getAt(data: unknown, path: string[]): unknown {
  return path.reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), data);
}

function setAt<T>(data: T, path: string[], value: unknown): T {
  if (path.length === 0) return value as T;
  const [key, ...rest] = path;
  const node = (data ?? {}) as Record<string, unknown>;
  const copy = (Array.isArray(node) ? [...node] : { ...node }) as Record<string, unknown>;
  copy[key] = setAt(node[key], rest, value);
  return copy as T;
}

/**
 * Les données de l'aperçu, avec les valeurs saisies ici et pas encore
 * revenues de l'admin. Une valeur saisie cesse de s'appliquer dès que
 * l'admin envoie autre chose pour ce champ (la même valeur, ou une autre).
 */
export function useInlineOverrides<T>(data: T): T {
  const current = useSyncExternalStore(subscribe, () => version, () => 0);
  useEffect(() => {
    lastData = data;
    // Valeurs auxquelles l'admin a répondu : plus rien à afficher à sa place.
    for (const [path, entry] of overrides) {
      if (getAt(data, path.split('.')) !== entry.before) overrides.delete(path);
    }
  }, [data]);
  return useMemo(() => {
    let merged = data;
    for (const [path, entry] of overrides) {
      const keys = path.split('.');
      if (getAt(data, keys) !== entry.before) continue;
      merged = setAt(merged, keys, entry.value);
    }
    return merged;
    // `current` : relire après chaque saisie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, current]);
}

// ── Texte modifié → format des champs ───────────────────────────────────────

const escapeStars = (text: string) => text.replace(/ /g, ' ').replace(/\*/g, '\\*');

function inlineText(node: Node, kind: InlineKind): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeStars(node.textContent ?? '');
  if (!(node instanceof HTMLElement)) return '';
  const tag = node.tagName;
  if (tag === 'BR') return '\n';
  const inner = Array.from(node.childNodes, (child) => inlineText(child, kind)).join('');
  const wrap = (mark: string) => {
    // Les espaces restent hors des marques : « *mot* », pas « *mot *».
    const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner);
    return match && match[2] ? `${match[1]}${mark}${match[2]}${mark}${match[3]}` : inner;
  };
  if ((tag === 'EM' || tag === 'I') && kind !== 'plain') return wrap('*');
  if ((tag === 'STRONG' || tag === 'B') && (kind === 'inline' || kind === 'prose')) return wrap('**');
  if (tag === 'DIV' || tag === 'P') return `\n${inner}`;
  return inner;
}

/** Le contenu d'un élément modifié, au format de son champ. */
export function serializeEditable(root: HTMLElement, kind: InlineKind): string {
  if (kind !== 'prose') {
    const text = Array.from(root.childNodes, (child) => inlineText(child, kind)).join('');
    if (kind === 'inline') return text.replace(/\n{2,}/g, '\n').trim();
    return text.replace(/\s*\n\s*/g, ' ').trim();
  }
  const blocks: string[] = [];
  let loose = '';
  const flush = () => {
    if (loose.trim()) blocks.push(loose.trim());
    loose = '';
  };
  for (const child of Array.from(root.childNodes)) {
    const el = child instanceof HTMLElement ? child : null;
    const tag = el?.tagName ?? '';
    if (/^H[1-6]$/.test(tag)) {
      flush();
      const prefix = el!.classList.contains('rich-text__subtitle') ? '### ' : '## ';
      blocks.push(prefix + inlineText(el!, kind).replace(/\s*\n\s*/g, ' ').trim());
    } else if (tag === 'UL' || tag === 'OL') {
      flush();
      const items = Array.from(el!.children, (li) => `- ${inlineText(li, kind).replace(/\s*\n\s*/g, ' ').trim()}`);
      blocks.push(items.join('\n'));
    } else if (tag === 'P' || tag === 'DIV') {
      flush();
      const text = Array.from(el!.childNodes, (node) => inlineText(node, kind)).join('').trim();
      if (text) blocks.push(text);
    } else {
      loose += inlineText(child, kind);
    }
  }
  flush();
  return blocks.join('\n\n');
}

// ── Les gestes ──────────────────────────────────────────────────────────────

function post(message: SectionMessage) {
  try {
    window.parent.postMessage(message, window.location.origin);
  } catch {
    // Admin sur une autre origine : rien à faire.
  }
}

/** Index de la section d'un chemin « layout.3.title » (le titre de la page : aucune). */
const sectionIndexOf = (path: string) => {
  const match = /^layout\.(\d+)\./.exec(path);
  return match ? Number(match[1]) : null;
};

function placeCaret(x: number, y: number) {
  const doc = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  const range = document.createRange();
  const fromPoint = document.caretRangeFromPoint?.(x, y);
  if (fromPoint) {
    range.setStart(fromPoint.startContainer, fromPoint.startOffset);
  } else {
    const position = doc.caretPositionFromPoint?.(x, y);
    if (!position) return;
    range.setStart(position.offsetNode, position.offset);
  }
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

type Editing = { el: HTMLElement; path: string; kind: InlineKind; original: Node[]; before: string };

export function PreviewInlineEditing() {
  useEffect(() => {
    let editing: Editing | null = null;

    const finish = (commit: boolean) => {
      const current = editing;
      if (!current) return;
      editing = null;
      const { el, path, kind, original, before } = current;
      const value = serializeEditable(el, kind);
      el.removeAttribute('contenteditable');
      el.removeAttribute('data-lcs-editing');
      el.replaceChildren(...original);
      if (!commit || value === before) return;
      overrides.set(path, { value, before: getAt(lastData, path.split('.')) });
      notify();
      post({ type: 'lcs:section', action: 'field', index: sectionIndexOf(path) ?? 0, path, value });
    };

    const start = (el: HTMLElement, x: number, y: number) => {
      const path = el.dataset.lcsEdit ?? '';
      const kind = (el.dataset.lcsKind as InlineKind | undefined) ?? 'plain';
      const empty = el.dataset.lcsEmpty === 'true';
      const original = Array.from(el.childNodes);
      const before = empty ? '' : serializeEditable(el, kind);
      el.replaceChildren(...(empty ? [] : original.map((node) => node.cloneNode(true))));
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('data-lcs-editing', '');
      editing = { el, path, kind, original, before };
      el.focus();
      if (!empty) placeCaret(x, y);
      const index = sectionIndexOf(path);
      if (index !== null) post({ type: 'lcs:section', action: 'select', index });
    };

    // Avant tout autre écouteur (sélection de la section, lien vers l'admin) :
    // le champ garde le curseur.
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (editing && editing.el.contains(target)) return;
      const el = target.closest<HTMLElement>('[data-lcs-edit]');
      if (!el || target.closest('[data-lcs-editor]')) return;
      e.preventDefault();
      if (editing) finish(true);
      start(el, e.clientX, e.clientY);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-lcs-edit]')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const image = target.closest<HTMLElement>('[data-lcs-image]');
      if (image && !target.closest('[data-lcs-editor]')) {
        e.preventDefault();
        e.stopPropagation();
        const path = image.dataset.lcsImage ?? '';
        const index = sectionIndexOf(path);
        if (index !== null) post({ type: 'lcs:section', action: 'select', index });
        post({ type: 'lcs:section', action: 'image', index: index ?? 0, path });
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!editing || !editing.el.contains(e.target as Node)) return;
      const { kind } = editing;
      const mod = e.metaKey || e.ctrlKey;
      if (e.key === 'Escape') {
        e.preventDefault();
        finish(false);
      } else if (e.key === 'Enter' && (mod || kind === 'plain' || kind === 'title')) {
        // Entrée valide un titre ; ⌘/Ctrl + Entrée, n'importe quel texte.
        e.preventDefault();
        editing.el.blur();
      } else if (e.key === 'Enter' && kind === 'inline') {
        e.preventDefault();
        document.execCommand('insertLineBreak');
      } else if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (kind === 'inline' || kind === 'prose') document.execCommand('bold');
      } else if (mod && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        if (kind !== 'plain') document.execCommand('italic');
      } else if (mod && e.key.toLowerCase() === 'u') {
        e.preventDefault();
      }
    };

    // Coller : du texte seul, sans la mise en forme d'origine.
    const onPaste = (e: ClipboardEvent) => {
      if (!editing || !editing.el.contains(e.target as Node)) return;
      e.preventDefault();
      let text = e.clipboardData?.getData('text/plain') ?? '';
      if (editing.kind === 'plain' || editing.kind === 'title') text = text.replace(/\s*\n\s*/g, ' ');
      document.execCommand('insertText', false, text);
    };

    const onFocusOut = (e: FocusEvent) => {
      if (editing && e.target === editing.el) finish(true);
    };

    document.execCommand('defaultParagraphSeparator', false, 'p');
    window.addEventListener('mousedown', onPointerDown, true);
    window.addEventListener('click', onClick, true);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('paste', onPaste, true);
    window.addEventListener('focusout', onFocusOut, true);
    return () => {
      finish(true);
      window.removeEventListener('mousedown', onPointerDown, true);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('paste', onPaste, true);
      window.removeEventListener('focusout', onFocusOut, true);
    };
  }, []);

  return null;
}
