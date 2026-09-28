'use client';

import './admin-sections.css';
import { useCallback, useEffect, useRef, useState, type DragEvent, type FocusEvent } from 'react';
import { BlocksField, ConfirmationModal, useField, useForm, useModal } from '@payloadcms/ui';
import type { BlocksFieldClientProps, ClientBlock } from 'payload';
import { SECTION_NAMES, type SectionMessage } from '@/lib/sections';

/**
 * « Sections de la page » : la liste des sections (champ blocs natif de
 * Payload, qui garde son glisser-déposer pour réordonner), précédée d'une
 * palette des types de sections toujours visible. On glisse une vignette à
 * l'endroit voulu — un trait doré montre où elle tombera —, ou on clique pour
 * l'ajouter à la fin.
 *
 * Reçoit aussi les gestes faits dans l'aperçu (components/sections/
 * PreviewEditing : « + » entre deux sections, monter, descendre, dupliquer,
 * masquer, supprimer). Une seule section est ouverte à la fois, comme chez
 * Shopify : celle qu'on vient d'ajouter ou de sélectionner.
 */

const DRAG_TYPE = 'application/x-lcs-section';

type Drop = { index: number; top: number };

const labelOf = (block: ClientBlock) => {
  const singular = block.labels?.singular;
  return typeof singular === 'string' ? singular : block.slug;
};

export function SectionsField(props: BlocksFieldClientProps) {
  const { path, field } = props;
  const schemaPath = (props as { schemaPath?: string }).schemaPath ?? field.name;
  const { addFieldRow, moveFieldRow, removeFieldRow, dispatchFields, setModified, getDataByPath } = useForm();
  const { openModal, closeModal } = useModal();
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const activeRow = useRef<number | null>(null);
  const deleteModal = `lcs-delete-section-${path}`;
  const { value: rowCount, rows: fieldRows } = useField<number>({ path, hasRows: true });
  const countRef = useRef(0);
  countRef.current = Array.isArray(fieldRows) ? fieldRows.length : 0;
  const listRef = useRef<HTMLDivElement>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const [dragging, setDragging] = useState(false);
  const blocks = (field.blocks ?? []).filter((b): b is ClientBlock => typeof b !== 'string');
  const readOnly = Boolean(props.readOnly);

  const rowElements = useCallback(() => {
    const pattern = new RegExp(`^${path.replace(/\./g, '\\.')}-row-\\d+$`);
    return [...(listRef.current?.querySelectorAll<HTMLElement>('[id]') ?? [])].filter((el) => pattern.test(el.id));
  }, [path]);

  /** Index d'insertion sous le pointeur, et hauteur du trait doré. */
  const dropAt = useCallback(
    (clientY: number): Drop => {
      const list = listRef.current?.getBoundingClientRect();
      const rows = rowElements();
      if (!list || rows.length === 0) return { index: 0, top: 0 };
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i].getBoundingClientRect();
        if (clientY < r.top + r.height / 2) return { index: i, top: r.top - list.top - 6 };
      }
      const last = rows[rows.length - 1].getBoundingClientRect();
      return { index: rows.length, top: last.bottom - list.top + 6 };
    },
    [rowElements],
  );

  /**
   * Accordéon : ouvre la section `index`, replie les autres. Passe par les
   * boutons de repli de Payload (qui lisent leur propre état, toujours à jour)
   * plutôt que de réécrire la liste des sections : une liste relue trop tôt,
   * juste après un ajout ou une duplication, effaçait la nouvelle section.
   */
  const openOnly = useCallback(
    (index: number) => {
      window.setTimeout(() => {
        const rowId = new RegExp(`^${path.replace(/\./g, '\\.')}-row-(\\d+)$`);
        for (const el of listRef.current?.querySelectorAll<HTMLElement>('[id]') ?? []) {
          const match = rowId.exec(el.id);
          if (!match) continue;
          const collapsible = el.querySelector<HTMLElement>(':scope > .collapsible');
          if (!collapsible) continue;
          const collapsed = collapsible.classList.contains('collapsible--collapsed');
          const shouldCollapse = Number(match[1]) !== index;
          if (collapsed !== shouldCollapse) {
            collapsible.querySelector<HTMLElement>(':scope > .collapsible__toggle-wrap .collapsible__toggle')?.click();
          }
        }
        activeRow.current = index;
      }, 400);
    },
    [path],
  );

  const scrollToRow = (index: number) =>
    window.setTimeout(() => {
      document.getElementById(`${path}-row-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);

  const insert = useCallback(
    (blockType: string, rowIndex: number) => {
      addFieldRow({ blockType, path, rowIndex, schemaPath });
      openOnly(rowIndex);
      scrollToRow(rowIndex);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addFieldRow, openOnly, path, schemaPath],
  );

  // Gestes faits dans l'aperçu en direct.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as SectionMessage | undefined;
      if (!data || data.type !== 'lcs:section' || typeof data.index !== 'number') return;
      const count = countRef.current;
      const { action, index } = data;
      if (action === 'add' && data.blockType) {
        insert(data.blockType, Math.max(0, Math.min(index, count)));
      } else if (action === 'up' && index > 0) {
        moveFieldRow({ path, moveFromIndex: index, moveToIndex: index - 1 });
        openOnly(index - 1);
        scrollToRow(index - 1);
      } else if (action === 'down' && index < count - 1) {
        moveFieldRow({ path, moveFromIndex: index, moveToIndex: index + 1 });
        openOnly(index + 1);
        scrollToRow(index + 1);
      } else if (action === 'duplicate' && index < count) {
        dispatchFields({ type: 'DUPLICATE_ROW', path, rowIndex: index });
        setModified(true);
        openOnly(index + 1);
        scrollToRow(index + 1);
      } else if (action === 'hide' && index < count) {
        const hiddenPath = `${path}.${index}.settings.hidden`;
        const current = Boolean(getDataByPath(hiddenPath));
        dispatchFields({ type: 'UPDATE', path: hiddenPath, value: !current });
        setModified(true);
      } else if (action === 'delete' && index < count) {
        setPendingDelete(index);
        openModal(deleteModal);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, insert, openOnly, getDataByPath, moveFieldRow, dispatchFields, setModified, openModal, deleteModal]);

  // Une section qu'on commence à modifier (clic dans l'aperçu, champ) s'ouvre seule.
  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    const rowId = new RegExp(`^${path.replace(/\./g, '\\.')}-row-(\\d+)$`);
    for (let el = e.target as HTMLElement | null; el && el !== listRef.current; el = el.parentElement) {
      const match = el.id ? rowId.exec(el.id) : null;
      if (!match) continue;
      const index = Number(match[1]);
      if (index !== activeRow.current) openOnly(index);
      return;
    }
  };

  const accepts = (e: DragEvent) => Array.from(e.dataTransfer.types).includes(DRAG_TYPE);

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!accepts(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDrop(dropAt(e.clientY));
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!listRef.current?.contains(e.relatedTarget as Node | null)) setDrop(null);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!accepts(e)) return;
    e.preventDefault();
    const blockType = e.dataTransfer.getData(DRAG_TYPE);
    const target = dropAt(e.clientY);
    setDrop(null);
    setDragging(false);
    if (blockType) insert(blockType, target.index);
  };

  const count = typeof rowCount === 'number' ? rowCount : 0;

  return (
    <div className={`lcs-sections${dragging ? ' is-dragging' : ''}`}>
      {!readOnly && (
        <div className="lcs-sections__palette">
          <p className="lcs-sections__hint">
            <strong>Ajouter une section :</strong> glissez-la à l’endroit voulu dans la liste, ou cliquez pour l’ajouter à la fin.
          </p>
          <ul className="lcs-sections__cards">
            {blocks.map((block) => (
              <li key={block.slug}>
                <button
                  type="button"
                  className="lcs-sections__card"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_TYPE, block.slug);
                    e.dataTransfer.effectAllowed = 'copy';
                    setDragging(true);
                  }}
                  onDragEnd={() => {
                    setDragging(false);
                    setDrop(null);
                  }}
                  onClick={() => insert(block.slug, count)}
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
      <div
        ref={listRef}
        className="lcs-sections__list"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onFocus={onFocus}
      >
        <BlocksField {...props} />
        {dragging && count === 0 && <div className="lcs-sections__empty-drop">Déposez la section ici</div>}
        {drop && count > 0 && <div className="lcs-sections__drop" style={{ top: drop.top }} aria-hidden />}
      </div>
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
        onConfirm={() => {
          if (pendingDelete !== null) removeFieldRow({ path, rowIndex: pendingDelete });
          setPendingDelete(null);
          closeModal(deleteModal);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

export default SectionsField;
