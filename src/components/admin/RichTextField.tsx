'use client';

import './admin-rich-text.css';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui';
import type { StaticDescription, TextFieldClientProps, TextareaFieldClientProps } from 'payload';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import {
  $isListNode,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { $createHeadingNode, $isHeadingNode, HeadingNode, type HeadingTagType } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { mergeRegister } from '@lexical/utils';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_HIGH,
  FORMAT_TEXT_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ENTER_COMMAND,
  TextNode,
  type TextFormatType,
} from 'lexical';
import type { RichTextVariant } from '@/lib/richTextAdmin';
import { $load, $serialize, IS_BOLD, IS_ITALIC } from './richTextLexical';

/**
 * Zone de texte avec mise en forme (gras, italique, titres, listes) pour les
 * champs `textarea` — et `text` pour les titres à mot en italique coloré.
 *
 * On écrit en voyant le rendu ; la valeur enregistrée reste une chaîne au
 * format de `lib/richText` (`*italique*`, `**gras**`, `## Titre`…), celui que
 * le site relit. Aucun changement de base : les textes déjà saisis s'ouvrent
 * tels quels, mis en forme.
 *
 * Variantes (`clientProps.variant`) :
 * - `prose`  : paragraphes, titre, sous-titre, liste, gras, italique ;
 * - `inline` : un paragraphe, gras, italique, Entrée = retour à la ligne ;
 * - `lines`  : une ligne par retour (le manifeste de l'accueil), italique ;
 * - `title`  : une seule ligne, italique (mot en italique coloré du site).
 */

type Props = (TextareaFieldClientProps | TextFieldClientProps) & { variant?: RichTextVariant };

type BlockType = 'paragraph' | 'h2' | 'h3' | 'list';

const VARIANTS: Record<
  RichTextVariant,
  { blocks: boolean; formats: TextFormatType[]; enter: 'paragraph' | 'linebreak' | 'none'; italicHint: string }
> = {
  prose: { blocks: true, formats: ['bold', 'italic'], enter: 'paragraph', italicHint: 'Italique' },
  inline: { blocks: false, formats: ['bold', 'italic'], enter: 'linebreak', italicHint: 'Italique' },
  lines: { blocks: false, formats: ['italic'], enter: 'paragraph', italicHint: 'Italique coloré' },
  title: { blocks: false, formats: ['italic'], enter: 'none', italicHint: 'Italique coloré' },
};

const THEME = {
  paragraph: 'lcs-rt__p',
  heading: { h2: 'lcs-rt__h2', h3: 'lcs-rt__h3' },
  list: { ul: 'lcs-rt__ul', listitem: 'lcs-rt__li', nested: { listitem: 'lcs-rt__li--nested' } },
  text: { bold: 'lcs-rt__bold', italic: 'lcs-rt__italic' },
};

// ── Plugins ─────────────────────────────────────────────────────────────────

/** Relie l'éditeur à la valeur du formulaire, dans les deux sens. */
function SyncPlugin({
  value,
  variant,
  onChange,
}: {
  value: string;
  variant: RichTextVariant;
  onChange: (next: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const emitted = useRef(value);

  // Valeur changée hors de l'éditeur (annulation, version restaurée) : on recharge.
  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    editor.update(() => $load(value, variant), { tag: 'lcs-external' });
  }, [editor, value, variant]);

  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves, tags }) => {
        if (tags.has('lcs-external')) return;
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
        const next = editorState.read(() => $serialize(variant));
        if (next === emitted.current) return;
        emitted.current = next;
        onChange(next);
      }),
    [editor, variant, onChange],
  );

  return null;
}

/**
 * Ce que le site sait afficher, et rien d'autre : Entrée selon la variante,
 * pas de souligné ni de code (Cmd+U, collage), titres ramenés à deux niveaux,
 * listes à puces seulement.
 */
function RulesPlugin({ variant }: { variant: RichTextVariant }) {
  const [editor] = useLexicalComposerContext();
  const { formats, enter, blocks } = VARIANTS[variant];

  useEffect(() => {
    const allowedMask = (formats.includes('bold') ? IS_BOLD : 0) | IS_ITALIC;
    const unregister = [
      editor.registerCommand(
        FORMAT_TEXT_COMMAND,
        (format) => !formats.includes(format),
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerNodeTransform(TextNode, (node) => {
        const format = node.getFormat();
        if (format & ~allowedMask) node.setFormat(format & allowedMask);
      }),
    ];
    if (enter === 'none') {
      unregister.push(
        editor.registerCommand(
          KEY_ENTER_COMMAND,
          (event) => {
            event?.preventDefault();
            return true;
          },
          COMMAND_PRIORITY_HIGH,
        ),
        editor.registerCommand(INSERT_PARAGRAPH_COMMAND, () => true, COMMAND_PRIORITY_HIGH),
        editor.registerCommand(INSERT_LINE_BREAK_COMMAND, () => true, COMMAND_PRIORITY_HIGH),
      );
    } else if (enter === 'linebreak') {
      unregister.push(
        editor.registerCommand(
          INSERT_PARAGRAPH_COMMAND,
          () => editor.dispatchCommand(INSERT_LINE_BREAK_COMMAND, false),
          COMMAND_PRIORITY_HIGH,
        ),
      );
    } else if (!blocks) {
      // Manifeste : Maj+Entrée fait aussi une nouvelle ligne.
      unregister.push(
        editor.registerCommand(
          INSERT_LINE_BREAK_COMMAND,
          () => editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined),
          COMMAND_PRIORITY_HIGH,
        ),
      );
    }
    if (blocks) {
      unregister.push(
        editor.registerNodeTransform(HeadingNode, (node) => {
          const tag = node.getTag();
          if (tag === 'h2' || tag === 'h3') return;
          node.replace($createHeadingNode(tag === 'h1' ? 'h2' : 'h3'), true);
        }),
        editor.registerNodeTransform(ListNode, (node) => {
          if (node.getListType() !== 'bullet') node.setListType('bullet');
        }),
      );
    }
    return mergeRegister(...unregister);
  }, [editor, formats, enter, blocks]);

  return null;
}

function EditablePlugin({ readOnly }: { readOnly: boolean }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => editor.setEditable(!readOnly), [editor, readOnly]);
  return null;
}

// ── Barre d'outils ──────────────────────────────────────────────────────────

function ToolbarButton({
  active,
  disabled,
  label,
  shortcut,
  className,
  onClick,
  children,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  shortcut?: string;
  className: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`lcs-rt__btn ${className}${active ? ' is-active' : ''}`}
      aria-pressed={active}
      title={shortcut ? `${label} (${shortcut})` : label}
      disabled={disabled}
      // Garder la sélection dans le texte pendant le clic.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Toolbar({ variant, readOnly }: { variant: RichTextVariant; readOnly: boolean }) {
  const [editor] = useLexicalComposerContext();
  const { blocks, formats, italicHint } = VARIANTS[variant];
  const [state, setState] = useState<{ bold: boolean; italic: boolean; block: BlockType }>({
    bold: false,
    italic: false,
    block: 'paragraph',
  });
  const mod = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';

  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState }) =>
        editorState.read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;
          const anchor = selection.anchor.getNode();
          const top = $isRootOrShadowRoot(anchor) ? null : anchor.getTopLevelElement();
          let block: BlockType = 'paragraph';
          if ($isListNode(top)) block = 'list';
          else if ($isHeadingNode(top)) block = top.getTag() === 'h2' ? 'h2' : 'h3';
          setState({ bold: selection.hasFormat('bold'), italic: selection.hasFormat('italic'), block });
        }),
      ),
    [editor],
  );

  const setBlock = useCallback(
    (type: BlockType) => {
      if (type === 'list') {
        editor.dispatchCommand(state.block === 'list' ? REMOVE_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND, undefined);
        return;
      }
      if (state.block === 'list') editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        // Recliquer sur « Titre » dans un titre le remet en paragraphe.
        const target: BlockType = type === state.block ? 'paragraph' : type;
        $setBlocksType(selection, () =>
          target === 'paragraph' ? $createParagraphNode() : $createHeadingNode(target as HeadingTagType),
        );
      });
      editor.focus();
    },
    [editor, state.block],
  );

  return (
    <div className="lcs-rt__toolbar" role="toolbar" aria-label="Mise en forme">
      {blocks && (
        <div className="lcs-rt__group">
          <ToolbarButton active={state.block === 'paragraph'} disabled={readOnly} label="Paragraphe" className="lcs-rt__btn--text" onClick={() => setBlock('paragraph')}>
            Paragraphe
          </ToolbarButton>
          <ToolbarButton active={state.block === 'h2'} disabled={readOnly} label="Titre" className="lcs-rt__btn--text lcs-rt__btn--h2" onClick={() => setBlock('h2')}>
            Titre
          </ToolbarButton>
          <ToolbarButton active={state.block === 'h3'} disabled={readOnly} label="Sous-titre" className="lcs-rt__btn--text lcs-rt__btn--h3" onClick={() => setBlock('h3')}>
            Sous-titre
          </ToolbarButton>
          <ToolbarButton active={state.block === 'list'} disabled={readOnly} label="Liste à puces" className="lcs-rt__btn--text" onClick={() => setBlock('list')}>
            <span aria-hidden>•</span> Liste
          </ToolbarButton>
        </div>
      )}
      <div className="lcs-rt__group">
        {formats.includes('bold') && (
          <ToolbarButton
            active={state.bold}
            disabled={readOnly}
            label="Gras"
            shortcut={`${mod}B`}
            className="lcs-rt__btn--bold"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          >
            G
          </ToolbarButton>
        )}
        <ToolbarButton
          active={state.italic}
          disabled={readOnly}
          label={italicHint}
          shortcut={`${mod}I`}
          className="lcs-rt__btn--italic"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        >
          I
        </ToolbarButton>
      </div>
    </div>
  );
}

// ── Champ ───────────────────────────────────────────────────────────────────

export function RichTextField(props: Props) {
  const { path, field, readOnly: readOnlyFromProps, variant = 'prose' } = props;
  const { value, setValue, showError, disabled } = useField<string>({ path });
  const readOnly = Boolean(readOnlyFromProps || disabled);
  const text = typeof value === 'string' ? value : '';

  const id = `field-${path.replace(/\./g, '__')}`;
  const inputId = `${id}-input`;
  const admin = (field.admin ?? {}) as { description?: StaticDescription; placeholder?: unknown; className?: string };
  const placeholder = typeof admin.placeholder === 'string' ? admin.placeholder : null;

  const onChange = useCallback((next: string) => setValue(next), [setValue]);

  const initialConfig = useMemo(
    () => ({
      namespace: `lcs-rich-text-${path}`,
      nodes: variant === 'prose' ? [HeadingNode, ListNode, ListItemNode] : [],
      theme: THEME,
      editable: !readOnly,
      editorState: () => $load(text, variant),
      onError: (error: Error) => console.error(error),
    }),
    // L'état initial ne se lit qu'une fois ; la suite passe par SyncPlugin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div
      className={[
        'field-type',
        'lcs-rt',
        `lcs-rt--${variant}`,
        admin.className,
        showError && 'error',
        readOnly && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      id={id}
    >
      <FieldLabel htmlFor={inputId} label={field.label} path={path} required={field.required} localized={field.localized} />
      <div className="field-type__wrap">
        <FieldError path={path} showError={showError} />
        <LexicalComposer initialConfig={initialConfig}>
          <div className="lcs-rt__frame">
            <Toolbar variant={variant} readOnly={readOnly} />
            <div className="lcs-rt__body">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    id={inputId}
                    className="lcs-rt__input"
                    ariaLabel={typeof field.label === 'string' ? field.label : undefined}
                    ariaInvalid={showError || undefined}
                    ariaMultiline={variant !== 'title'}
                  />
                }
                placeholder={placeholder ? <div className="lcs-rt__placeholder">{placeholder}</div> : null}
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>
          </div>
          <HistoryPlugin />
          {variant === 'prose' && <ListPlugin />}
          <RulesPlugin variant={variant} />
          <EditablePlugin readOnly={readOnly} />
          <SyncPlugin value={text} variant={variant} onChange={onChange} />
        </LexicalComposer>
        <FieldDescription description={admin.description} path={path} />
      </div>
    </div>
  );
}
