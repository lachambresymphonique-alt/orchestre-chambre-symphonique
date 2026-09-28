'use client';

import './admin-sections.css';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent, type FocusEvent } from 'react';
import {
  BlocksField,
  ConfirmationModal,
  useField,
  useForm,
  useFormBackgroundProcessing,
  useFormFields,
  useModal,
  useWatchForm,
} from '@payloadcms/ui';
import type { BlocksFieldClientProps, ClientBlock } from 'payload';
import { DRAG_MOVE_SECTION, DRAG_NEW_SECTION, SECTION_NAMES, type SectionMessage } from '@/lib/sections';
import { SectionIcon } from '@/components/sections/SectionIcon';
import { SectionSummary, type Row } from './SectionRowLabel';

/**
 * « Sections de la page », en deux temps comme l'éditeur de thème de Shopify :
 *
 * - le plan de la page : la palette des types de sections (glisser une
 *   vignette à l'endroit voulu, ici ou sur l'aperçu, ou cliquer pour l'ajouter
 *   à la fin), puis la liste des sections, une par ligne, qu'on réordonne en
 *   les faisant glisser et qu'on ouvre d'un clic ;
 * - une section ouverte : ses réglages seuls (la ligne du champ blocs de
 *   Payload), sous une barre « ← Toutes les sections » qui porte aussi ses
 *   gestes (monter, descendre, dupliquer, masquer, supprimer).
 *
 * Reçoit aussi les gestes faits dans l'aperçu (components/sections/
 * PreviewEditing) : clic sur une section, « + », glisser-déposer, barre
 * d'outils. La section ouverte est signalée à l'aperçu, qui l'entoure.
 *
 * Tout changement de la liste (ajout, déplacement, duplication, suppression)
 * attend la fin de l'enregistrement automatique en cours : Payload 3.74
 * reverse à son retour les valeurs enregistrées sur les champs non modifiés,
 * qui après un déplacement ne sont plus ceux des mêmes sections (contenu
 * mélangé, ou déplacement jamais enregistré). Le plan remplace pour la même
 * raison la liste native (poignées, menu ⋯), qui ne passerait pas par là.
 */

type Drop = { index: number; top: number };

type Action = Pick<SectionMessage, 'action' | 'index' | 'blockType' | 'to'>;

const labelOf = (block: ClientBlock) => {
  const singular = block.labels?.singular;
  return typeof singular === 'string' ? singular : block.slug;
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Nouvel index de la section `current` quand une section passe de `from` à `to`. */
function afterMove(current: number, from: number, to: number): number {
  if (current === from) return to;
  if (from < current && to >= current) return current - 1;
  if (from > current && to <= current) return current + 1;
  return current;
}

const dragKinds = (e: DragEvent) => Array.from(e.dataTransfer.types);

/** Le plan de la page : une ligne par section. */
function SectionsOutline({
  path,
  count,
  readOnly,
  dragging,
  onOpen,
  onToggleHidden,
}: {
  path: string;
  count: number;
  readOnly: boolean;
  dragging: boolean;
  onOpen: (index: number) => void;
  onToggleHidden: (index: number) => void;
}) {
  // Relu à chaque frappe : l'extrait de chaque ligne suit la saisie.
  const { getDataByPath } = useWatchForm();
  const rows = (getDataByPath(path) as Row[] | undefined) ?? [];
  const errorPaths = useFormFields(([fields]) => (fields[path] as { errorPaths?: string[] } | undefined)?.errorPaths);

  if (count === 0) {
    return (
      <div className={`lcs-outline__empty${dragging ? ' is-target' : ''}`}>
        {dragging ? 'Déposez la section ici' : 'La page est vide : glissez une première section ici ou sur l’aperçu.'}
      </div>
    );
  }

  return (
    <ol className="lcs-outline">
      {Array.from({ length: count }, (_, index) => {
        const data = rows[index];
        const hidden = Boolean((data?.settings as { hidden?: boolean } | undefined)?.hidden);
        const hasErrors = Array.isArray(errorPaths) && errorPaths.some((p) => p.startsWith(`${path}.${index}.`));
        return (
          <li
            key={String(data?.id ?? index)}
            className={`lcs-outline__item${hidden ? ' is-hidden' : ''}${hasErrors ? ' has-errors' : ''}`}
            draggable={!readOnly}
            onDragStart={(e) => {
              e.dataTransfer.setData(DRAG_MOVE_SECTION, String(index));
              e.dataTransfer.effectAllowed = 'move';
            }}
          >
            {!readOnly && (
              <span className="lcs-outline__grip" aria-hidden title="Glisser pour déplacer">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" />
                  <circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
                </svg>
              </span>
            )}
            <button type="button" className="lcs-outline__open" onClick={() => onOpen(index)} title="Modifier cette section">
              <SectionSummary data={data} index={index} />
              {hasErrors && <span className="lcs-outline__error">À corriger</span>}
            </button>
            {!readOnly && (
              <button
                type="button"
                className="lcs-outline__eye"
                onClick={() => onToggleHidden(index)}
                title={hidden ? 'Afficher sur le site' : 'Masquer (le contenu est gardé)'}
                aria-label={hidden ? 'Afficher' : 'Masquer'}
              >
                <SectionIcon name={hidden ? 'show' : 'hide'} />
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function SectionsField(props: BlocksFieldClientProps) {
  const { path, field } = props;
  const schemaPath = (props as { schemaPath?: string }).schemaPath ?? field.name;
  const { addFieldRow, moveFieldRow, removeFieldRow, dispatchFields, setModified, getDataByPath } = useForm();
  const { openModal, closeModal } = useModal();
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const deleteModal = `lcs-delete-section-${path}`;
  const { rows: fieldRows } = useField<number>({ path, hasRows: true });
  const rowsList = Array.isArray(fieldRows) ? fieldRows : [];
  const count = rowsList.length;
  const countRef = useRef(count);
  const listRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const [dragging, setDragging] = useState(false);
  const blocks = (field.blocks ?? []).filter((b): b is ClientBlock => typeof b !== 'string');
  const readOnly = Boolean(props.readOnly);

  // Section ouverte (null : le plan de la page).
  const [selected, setSelectedState] = useState<number | null>(null);
  const selectedRef = useRef<number | null>(null);
  const rowId = useMemo(() => new RegExp(`^${escapeRe(path)}-row-(\\d+)$`), [path]);

  const selectedHidden = useFormFields(([fields]) =>
    selected === null ? false : Boolean(fields[`${path}.${selected}.settings.hidden`]?.value),
  );
  const selectedType = selected === null ? '' : String(rowsList[selected]?.blockType ?? '');

  // Changements de la liste mis en attente pendant un enregistrement automatique.
  const saving = useFormBackgroundProcessing();
  const savingRef = useRef(saving);
  const pending = useRef<(() => void)[]>([]);
  const whenIdle = useCallback((change: () => void) => {
    if (savingRef.current) pending.current.push(change);
    else change();
  }, []);
  useEffect(() => {
    if (saving) return;
    const queued = pending.current;
    pending.current = [];
    queued.forEach((change) => change());
  }, [saving]);

  /**
   * Déplie la ligne `index` du champ blocs (les autres sont masquées, leur
   * état replié importe peu). Passe par le bouton de repli de Payload plutôt
   * que de réécrire la liste : une liste relue trop tôt, juste après un
   * ajout, effaçait la nouvelle section. Rejoué un peu plus tard pour une
   * section qui vient d'être créée.
   */
  const openOnly = useCallback(
    (index: number) => {
      const apply = () => {
        const collapsible = document.getElementById(`${path}-row-${index}`)?.querySelector<HTMLElement>(':scope > .collapsible');
        if (!collapsible?.classList.contains('collapsible--collapsed')) return;
        collapsible.querySelector<HTMLElement>(':scope > .collapsible__toggle-wrap .collapsible__toggle')?.click();
      };
      if (index < 0) return;
      apply();
      window.setTimeout(apply, 400);
    },
    [path],
  );

  const tellPreview = useCallback((index: number | null) => {
    const frame = document.querySelector<HTMLIFrameElement>('iframe.live-preview-iframe');
    try {
      frame?.contentWindow?.postMessage({ type: 'lcs:selected', index }, window.location.origin);
    } catch {
      // Aperçu sur une autre origine : rien à faire.
    }
  }, []);

  /**
   * Ouvre une section (ou revient au plan avec null), en haut du panneau.
   * `open: false` : la section est déjà ouverte (après un déplacement, l'état
   * replié suit chaque section ; le rejouer ici, avant que Payload ait fini de
   * déplacer, ouvrirait la mauvaise).
   */
  const select = useCallback(
    (index: number | null, { scroll = true, open = true } = {}) => {
      selectedRef.current = index;
      setSelectedState(index);
      if (open) openOnly(index ?? -1);
      tellPreview(index);
      if (scroll) {
        window.setTimeout(() => rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      }
    },
    [openOnly, tellPreview],
  );

  const move = useCallback(
    (from: number, to: number) => {
      moveFieldRow({ path, moveFromIndex: from, moveToIndex: to });
      const current = selectedRef.current;
      if (current !== null) select(afterMove(current, from, to), { scroll: false, open: false });
    },
    [moveFieldRow, path, select],
  );

  /** Un geste sur une section, venu de l'aperçu, du plan ou de la barre de la section ouverte. */
  const act = useCallback(
    (data: Action) => {
      const { action, index } = data;
      if (action === 'select') {
        if (index < countRef.current && index !== selectedRef.current) select(index);
        return;
      }
      if (action === 'ready') {
        tellPreview(selectedRef.current);
        return;
      }
      if (action === 'delete') {
        if (index < countRef.current) {
          setPendingDelete(index);
          openModal(deleteModal);
        }
        return;
      }
      whenIdle(() => {
        const count = countRef.current;
        if (action === 'add' && data.blockType) {
          const at = Math.max(0, Math.min(index, count));
          addFieldRow({ blockType: data.blockType, path, rowIndex: at, schemaPath });
          countRef.current = count + 1;
          select(at);
        } else if (action === 'up' && index > 0 && index < count) {
          move(index, index - 1);
        } else if (action === 'down' && index < count - 1) {
          move(index, index + 1);
        } else if (action === 'move' && typeof data.to === 'number' && index < count) {
          const final = data.to > index ? data.to - 1 : data.to;
          if (final !== index && final >= 0 && final < count) move(index, final);
        } else if (action === 'duplicate' && index < count) {
          dispatchFields({ type: 'DUPLICATE_ROW', path, rowIndex: index });
          setModified(true);
          countRef.current = count + 1;
          select(index + 1);
        } else if (action === 'hide' && index < count) {
          const hiddenPath = `${path}.${index}.settings.hidden`;
          dispatchFields({ type: 'UPDATE', path: hiddenPath, value: !getDataByPath(hiddenPath) });
          setModified(true);
        }
      });
    },
    [select, tellPreview, openModal, deleteModal, whenIdle, addFieldRow, path, schemaPath, move, dispatchFields, setModified, getDataByPath],
  );

  const confirmDelete = () => {
    const index = pendingDelete;
    setPendingDelete(null);
    closeModal(deleteModal);
    if (index === null) return;
    whenIdle(() => {
      removeFieldRow({ path, rowIndex: index });
      countRef.current = Math.max(0, countRef.current - 1);
      const current = selectedRef.current;
      if (current === index) select(null);
      else if (current !== null && current > index) select(current - 1, { scroll: false, open: false });
    });
  };

  // Gestes faits dans l'aperçu en direct.
  const actRef = useRef(act);
  useLayoutEffect(() => {
    countRef.current = count;
    savingRef.current = saving;
    actRef.current = act;
  });
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as SectionMessage | undefined;
      if (!data || data.type !== 'lcs:section' || typeof data.index !== 'number') return;
      actRef.current(data);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Un champ qui reçoit le curseur (clic dans l'aperçu, tabulation) ouvre sa section.
  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!target.matches('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return;
    for (let el: HTMLElement | null = target; el && el !== listRef.current; el = el.parentElement) {
      const match = el.id ? rowId.exec(el.id) : null;
      if (!match) continue;
      const index = Number(match[1]);
      if (index !== selectedRef.current) select(index, { scroll: false });
      return;
    }
  };

  /** Index d'insertion sous le pointeur, et hauteur du trait doré, dans le plan. */
  const dropAt = (clientY: number): Drop => {
    const list = listRef.current?.getBoundingClientRect();
    const items = [...(listRef.current?.querySelectorAll<HTMLElement>('.lcs-outline__item') ?? [])];
    if (!list || items.length === 0) return { index: 0, top: 0 };
    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) return { index: i, top: r.top - list.top - 3 };
    }
    const last = items[items.length - 1].getBoundingClientRect();
    return { index: items.length, top: last.bottom - list.top + 3 };
  };

  const accepts = (e: DragEvent) => dragKinds(e).includes(DRAG_NEW_SECTION) || dragKinds(e).includes(DRAG_MOVE_SECTION);

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!accepts(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = dragKinds(e).includes(DRAG_MOVE_SECTION) ? 'move' : 'copy';
    setDragging(true);
    setDrop(dropAt(e.clientY));
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!listRef.current?.contains(e.relatedTarget as Node | null)) setDrop(null);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!accepts(e)) return;
    e.preventDefault();
    const target = dropAt(e.clientY);
    setDrop(null);
    setDragging(false);
    const blockType = e.dataTransfer.getData(DRAG_NEW_SECTION);
    if (blockType) {
      act({ action: 'add', index: target.index, blockType });
      return;
    }
    const from = Number(e.dataTransfer.getData(DRAG_MOVE_SECTION));
    if (Number.isInteger(from)) act({ action: 'move', index: from, to: target.index });
  };

  // Une section ouverte qui a disparu (version restaurée…) ramène au plan.
  const focused = selected !== null && selected < count;
  const rowSelector = focused ? `[id="${path}-row-${selected}"]` : '';

  return (
    <div
      ref={rootRef}
      className={`lcs-sections${dragging ? ' is-dragging' : ''}${focused ? ' is-focused' : ''}`}
      onDragEnd={() => {
        setDragging(false);
        setDrop(null);
      }}
    >
      {focused ? (
        <>
          {/* Seule la section ouverte reste à l'écran. */}
          <style>{`.lcs-sections.is-focused .blocks-field__rows > [id]:not(${rowSelector}) { display: none; }`}</style>
          <div className="lcs-focus">
            <button type="button" className="lcs-focus__back" onClick={() => select(null)}>
              <SectionIcon name="back" />
              Toutes les sections
            </button>
            <div className="lcs-focus__head">
              <span className="lcs-srow__num">{String(selected + 1).padStart(2, '0')}</span>
              <span className="lcs-focus__name">{SECTION_NAMES[selectedType] ?? 'Section'}</span>
              {selectedHidden && <span className="lcs-srow__badge">Masquée</span>}
              {!readOnly && (
                <span className="lcs-focus__actions" role="toolbar" aria-label="Gestes sur la section">
                  <button type="button" onClick={() => act({ action: 'up', index: selected })} disabled={selected === 0} title="Monter" aria-label="Monter">
                    <SectionIcon name="up" />
                  </button>
                  <button type="button" onClick={() => act({ action: 'down', index: selected })} disabled={selected >= count - 1} title="Descendre" aria-label="Descendre">
                    <SectionIcon name="down" />
                  </button>
                  <button type="button" onClick={() => act({ action: 'duplicate', index: selected })} title="Dupliquer" aria-label="Dupliquer">
                    <SectionIcon name="duplicate" />
                  </button>
                  <button
                    type="button"
                    onClick={() => act({ action: 'hide', index: selected })}
                    title={selectedHidden ? 'Afficher sur le site' : 'Masquer (le contenu est gardé)'}
                    aria-label={selectedHidden ? 'Afficher' : 'Masquer'}
                  >
                    <SectionIcon name={selectedHidden ? 'show' : 'hide'} />
                  </button>
                  <button type="button" className="lcs-focus__danger" onClick={() => act({ action: 'delete', index: selected })} title="Supprimer" aria-label="Supprimer">
                    <SectionIcon name="delete" />
                  </button>
                </span>
              )}
            </div>
          </div>
        </>
      ) : null}
      <div ref={listRef} className="lcs-sections__list" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onFocus={onFocus}>
        {!focused && (
          <>
            <p className="lcs-outline__title">
              Sections de la page
              {count > 0 && <span> · cliquez pour modifier, glissez pour déplacer</span>}
            </p>
            <SectionsOutline
              path={path}
              count={count}
              readOnly={readOnly}
              dragging={dragging}
              onOpen={(index) => act({ action: 'select', index })}
              onToggleHidden={(index) => act({ action: 'hide', index })}
            />
          </>
        )}
        <BlocksField {...props} />
        {drop && !focused && count > 0 && <div className="lcs-sections__drop" style={{ top: drop.top }} aria-hidden />}
      </div>
      {!focused && !readOnly && (
        <div className="lcs-sections__palette">
          <p className="lcs-sections__hint">
            <strong>Ajouter une section</strong> · glissez-la à l’endroit voulu, dans la liste ou sur l’aperçu, ou cliquez pour l’ajouter à la fin.
          </p>
          <ul className="lcs-sections__cards">
            {blocks.map((block) => (
              <li key={block.slug}>
                <button
                  type="button"
                  className="lcs-sections__card"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_NEW_SECTION, block.slug);
                    e.dataTransfer.effectAllowed = 'copy';
                    setDragging(true);
                  }}
                  onClick={() => act({ action: 'add', index: count, blockType: block.slug })}
                  title={`Glisser dans la page, ou cliquer pour ajouter « ${labelOf(block)} » à la fin`}
                >
                  {block.imageURL && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={block.imageURL} alt="" draggable={false} />
                  )}
                  <span>{labelOf(block)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ConfirmationModal
        modalSlug={deleteModal}
        heading="Supprimer cette section ?"
        body={
          pendingDelete !== null
            ? `La section « ${SECTION_NAMES[String((getDataByPath(`${path}.${pendingDelete}.blockType`) as string) ?? '')] ?? 'Section'} » et son contenu seront retirés de la page. Pour la retirer du site sans la perdre, masquez-la plutôt (l’œil).`
            : ''
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

export default SectionsField;
