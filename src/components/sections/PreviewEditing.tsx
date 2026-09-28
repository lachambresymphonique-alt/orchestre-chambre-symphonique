'use client';

import { useEffect, useRef, useState } from 'react';
import { SectionIcon } from './SectionIcon';
import {
  DRAG_MOVE_SECTION,
  DRAG_NEW_SECTION,
  SECTION_PRESETS,
  type SectionMessage,
  type SelectedSectionMessage,
} from '@/lib/sections';

/**
 * Outils d'édition posés sur l'aperçu en direct de l'admin (jamais sur le
 * site public) : « + » entre deux sections pour en ajouter une, barre
 * d'outils d'une section au survol (monter, descendre, dupliquer, masquer,
 * supprimer). Chaque geste part vers le formulaire de l'admin
 * (components/admin/SectionsField), qui l'applique : l'aperçu se met ensuite
 * à jour comme pour toute modification.
 */

type Win = Window & { __lcsScrollTo?: number };

function send(action: SectionMessage['action'], index: number, preset?: string, to?: number) {
  const message: SectionMessage = { type: 'lcs:section', action, index, preset, to };
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
      const preset = e.dataTransfer?.getData(DRAG_NEW_SECTION);
      if (preset) {
        send('add', target.index, preset);
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
            {SECTION_PRESETS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="lcs-picker__card"
                  onClick={() => {
                    send('add', index, s.id);
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
        <SectionIcon name="up" />
      </button>
      <button type="button" onClick={() => send('down', index)} disabled={index >= count - 1} title="Descendre" aria-label="Descendre">
        <SectionIcon name="down" />
      </button>
      <button type="button" onClick={() => send('duplicate', index)} title="Dupliquer" aria-label="Dupliquer">
        <SectionIcon name="duplicate" />
      </button>
      <button type="button" onClick={() => send('hide', index)} title={hidden ? 'Afficher sur le site' : 'Masquer (le contenu est gardé)'} aria-label={hidden ? 'Afficher' : 'Masquer'}>
        <SectionIcon name={hidden ? 'show' : 'hide'} />
      </button>
      <button type="button" className="lcs-sectionbar__danger" onClick={() => send('delete', index)} title="Supprimer" aria-label="Supprimer">
        <SectionIcon name="delete" />
      </button>
    </div>
  );
}

/**
 * Sélection façon Shopify : un clic sur une section l'ouvre dans le panneau de
 * l'admin, et la section ouverte là-bas est entourée ici.
 */
export function PreviewSelection() {
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-lcs-editor]')) return;
      const section = target.closest<HTMLElement>('section[data-live-field^="layout__"]');
      if (!section) return;
      const index = Number(section.getAttribute('data-live-field')?.slice('layout__'.length));
      if (Number.isInteger(index)) send('select', index);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as SelectedSectionMessage | undefined;
      if (data?.type !== 'lcs:selected') return;
      setSelected(typeof data.index === 'number' ? data.index : null);
      if (typeof data.index !== 'number') return;
      const el = document.querySelector(`[data-live-field="layout__${data.index}"]`);
      const r = el?.getBoundingClientRect();
      if (el && r && (r.bottom < 80 || r.top > window.innerHeight - 80)) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    document.addEventListener('click', onClick, true);
    window.addEventListener('message', onMessage);
    send('ready', 0);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('message', onMessage);
    };
  }, []);

  if (selected === null) return null;
  return <style>{`section[data-live-field="layout__${selected}"] { outline: 2px solid #c9a84c; outline-offset: -2px; }`}</style>;
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
