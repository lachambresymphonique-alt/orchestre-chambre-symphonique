'use client';

import { useEffect, useRef, useState } from 'react';
import { DRAG_MOVE_SECTION, DRAG_NEW_SECTION, SECTION_CATALOG, type SectionMessage } from '@/lib/sections';

/**
 * Outils d'édition posés sur l'aperçu en direct de l'admin (jamais sur le
 * site public) : « + » entre deux sections pour en ajouter une, barre
 * d'outils d'une section au survol (monter, descendre, dupliquer, masquer,
 * supprimer). Chaque geste part vers le formulaire de l'admin
 * (components/admin/SectionsField), qui l'applique : l'aperçu se met ensuite
 * à jour comme pour toute modification.
 */

type Win = Window & { __lcsScrollTo?: number };

function send(action: SectionMessage['action'], index: number, blockType?: string, to?: number) {
  const message: SectionMessage = { type: 'lcs:section', action, index, blockType, to };
  try {
    window.parent.postMessage(message, window.location.origin);
  } catch {
    // Admin sur une autre origine : rien à faire.
  }
  if (action === 'add') (window as Win).__lcsScrollTo = index;
  if (action === 'duplicate') (window as Win).__lcsScrollTo = index + 1;
  if (action === 'up') (window as Win).__lcsScrollTo = index - 1;
  if (action === 'down') (window as Win).__lcsScrollTo = index + 1;
  if (action === 'move' && typeof to === 'number') (window as Win).__lcsScrollTo = to > index ? to - 1 : to;
}

type DropLine = { index: number; top: number };

/**
 * Glisser-déposer sur l'aperçu : une vignette de la palette de l'admin
 * (nouvelle section) ou la poignée d'une section de l'aperçu (déplacement).
 * Un trait doré montre où elle tombera ; au dépôt, le geste part vers l'admin.
 */
export function PreviewDropZone() {
  const [line, setLine] = useState<DropLine | null>(null);

  useEffect(() => {
    const sections = () => [...document.querySelectorAll<HTMLElement>('section[data-live-field^="layout__"]')];
    const dropAt = (y: number): DropLine => {
      const list = sections();
      if (list.length === 0) {
        const anchor = document.querySelector<HTMLElement>('.page-header');
        const r = anchor?.getBoundingClientRect();
        return { index: 0, top: r ? r.bottom + 24 : 160 };
      }
      for (let i = 0; i < list.length; i++) {
        const r = list[i].getBoundingClientRect();
        if (y < r.top + r.height / 2) return { index: i, top: r.top };
      }
      return { index: list.length, top: list[list.length - 1].getBoundingClientRect().bottom };
    };
    const kinds = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []);
    const accepts = (e: DragEvent) => kinds(e).includes(DRAG_NEW_SECTION) || kinds(e).includes(DRAG_MOVE_SECTION);

    const onOver = (e: DragEvent) => {
      if (!accepts(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = kinds(e).includes(DRAG_MOVE_SECTION) ? 'move' : 'copy';
      setLine(dropAt(e.clientY));
    };
    const onLeave = (e: DragEvent) => {
      // Sortie de l'aperçu (vers l'admin, ou hors de la fenêtre).
      if (!e.relatedTarget) setLine(null);
    };
    const onDrop = (e: DragEvent) => {
      if (!accepts(e)) return;
      e.preventDefault();
      const target = dropAt(e.clientY);
      setLine(null);
      const blockType = e.dataTransfer?.getData(DRAG_NEW_SECTION);
      if (blockType) {
        send('add', target.index, blockType);
        return;
      }
      const from = Number(e.dataTransfer?.getData(DRAG_MOVE_SECTION));
      if (Number.isInteger(from) && target.index !== from && target.index !== from + 1) send('move', from, undefined, target.index);
    };
    const clear = () => setLine(null);

    document.addEventListener('dragover', onOver);
    document.addEventListener('dragleave', onLeave);
    document.addEventListener('drop', onDrop);
    document.addEventListener('dragend', clear);
    return () => {
      document.removeEventListener('dragover', onOver);
      document.removeEventListener('dragleave', onLeave);
      document.removeEventListener('drop', onDrop);
      document.removeEventListener('dragend', clear);
    };
  }, []);

  if (!line) return null;
  return (
    <div className="lcs-dropline" style={{ top: line.top }} aria-hidden data-lcs-editor>
      <span>Déposer ici</span>
    </div>
  );
}

export function InsertPoint({ index, big = false }: { index: number; big?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`lcs-insert${big ? ' lcs-insert--big' : ''}${open ? ' is-open' : ''}`} data-lcs-editor>
      <button type="button" className="lcs-insert__btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="lcs-insert__plus" aria-hidden>
          +
        </span>
        <span className="lcs-insert__label">Ajouter une section</span>
      </button>
      {open && (
        <div className="lcs-picker" role="dialog" aria-label="Ajouter une section">
          <p className="lcs-picker__title">Ajouter une section ici</p>
          <ul className="lcs-picker__grid">
            {SECTION_CATALOG.map((s) => (
              <li key={s.slug}>
                <button
                  type="button"
                  className="lcs-picker__card"
                  onClick={() => {
                    send('add', index, s.slug);
                    setOpen(false);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.thumb} alt="" />
                  <strong>{s.name}</strong>
                  <span>{s.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export function SectionToolbar({ index, count, name, hidden }: { index: number; count: number; name: string; hidden: boolean }) {
  return (
    <div className="lcs-sectionbar" data-lcs-editor role="toolbar" aria-label={`Section ${name}`}>
      <span
        className="lcs-sectionbar__grip"
        draggable
        title="Glisser pour déplacer la section"
        onDragStart={(e) => {
          e.dataTransfer.setData(DRAG_MOVE_SECTION, String(index));
          e.dataTransfer.effectAllowed = 'move';
          const section = (e.currentTarget as HTMLElement).closest('section');
          if (section) e.dataTransfer.setDragImage(section, 40, 20);
        }}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden fill="currentColor">
          <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" />
          <circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
        </svg>
        <span className="lcs-sectionbar__name">{name}</span>
      </span>
      <button type="button" onClick={() => send('up', index)} disabled={index === 0} title="Monter" aria-label="Monter">
        <Icon d="M12 19V5M5 12l7-7 7 7" />
      </button>
      <button type="button" onClick={() => send('down', index)} disabled={index >= count - 1} title="Descendre" aria-label="Descendre">
        <Icon d="M12 5v14M5 12l7 7 7-7" />
      </button>
      <button type="button" onClick={() => send('duplicate', index)} title="Dupliquer" aria-label="Dupliquer">
        <Icon d="M9 9h10v10H9zM5 15V5h10" />
      </button>
      <button type="button" onClick={() => send('hide', index)} title={hidden ? 'Afficher sur le site' : 'Masquer (le contenu est gardé)'} aria-label={hidden ? 'Afficher' : 'Masquer'}>
        <Icon d={hidden ? 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' : 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.9 8.3 2 12 2 12s4 7 10 7a9.7 9.7 0 0 0 5.4-1.6'} />
      </button>
      <button type="button" className="lcs-sectionbar__danger" onClick={() => send('delete', index)} title="Supprimer" aria-label="Supprimer">
        <Icon d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
      </button>
    </div>
  );
}

/** Après un ajout, une duplication ou un déplacement : amène la section à l'écran. */
export function PreviewScroll() {
  useEffect(() => {
    const w = window as Win;
    if (typeof w.__lcsScrollTo !== 'number') return;
    const el = document.querySelector(`[data-live-field="layout__${w.__lcsScrollTo}"]`);
    if (!el) return;
    w.__lcsScrollTo = undefined;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  return null;
}
