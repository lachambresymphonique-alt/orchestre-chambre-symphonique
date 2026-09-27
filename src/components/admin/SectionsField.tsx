'use client';

import './admin-sections.css';
import { useCallback, useRef, useState, type DragEvent } from 'react';
import { BlocksField, useField, useForm } from '@payloadcms/ui';
import type { BlocksFieldClientProps, ClientBlock } from 'payload';

/**
 * « Sections de la page » : la liste des sections (champ blocs natif de
 * Payload, qui garde son glisser-déposer pour réordonner), précédée d'une
 * palette des types de sections toujours visible. On glisse une vignette à
 * l'endroit voulu — un trait doré montre où elle tombera —, ou on clique pour
 * l'ajouter à la fin.
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
  const { addFieldRow } = useForm();
  const { value: rowCount } = useField<number>({ path, hasRows: true });
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

  const insert = useCallback(
    (blockType: string, rowIndex: number) => {
      addFieldRow({ blockType, path, rowIndex, schemaPath });
      window.setTimeout(() => {
        document.getElementById(`${path}-row-${rowIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    },
    [addFieldRow, path, schemaPath],
  );

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
      <div ref={listRef} className="lcs-sections__list" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        <BlocksField {...props} />
        {dragging && count === 0 && <div className="lcs-sections__empty-drop">Déposez la section ici</div>}
        {drop && count > 0 && <div className="lcs-sections__drop" style={{ top: drop.top }} aria-hidden />}
      </div>
    </div>
  );
}

export default SectionsField;
