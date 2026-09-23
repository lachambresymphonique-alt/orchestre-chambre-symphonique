'use client';

import './admin-home-sections.css';
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { useField, useFormFields } from '@payloadcms/ui';
import type { JSONFieldClientProps } from 'payload';
import {
  HOME_HERO,
  homeSectionInfo,
  resolveHomeSections,
  type HomeSectionEntry,
} from '@/lib/homeSections';

/**
 * Ordre des sections de la page d'accueil (global `home-page`, champ JSON
 * `sections`).
 *
 * Une liste : la bannière, fixe, puis chaque section, que l'on glisse pour la
 * déplacer (ou que l'on monte et descend avec les flèches, au clavier). L'œil
 * masque une section sans effacer son contenu ; « Modifier » descend jusqu'aux
 * réglages de la section, plus bas dans le formulaire. L'aperçu en direct
 * suit à chaque changement ; l'enregistrement publie.
 */

const GripIcon = () => (
  <svg viewBox="0 0 12 18" width="12" height="18" aria-hidden="true" fill="currentColor">
    <circle cx="3" cy="3" r="1.3" />
    <circle cx="9" cy="3" r="1.3" />
    <circle cx="3" cy="9" r="1.3" />
    <circle cx="9" cy="9" r="1.3" />
    <circle cx="3" cy="15" r="1.3" />
    <circle cx="9" cy="15" r="1.3" />
  </svg>
);

const ArrowIcon = ({ up }: { up?: boolean }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {up ? <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" /> : <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" />}
  </svg>
);

const EyeIcon = ({ off }: { off?: boolean }) => (
  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.8 10S5 4.2 10 4.2 18.2 10 18.2 10 15 15.8 10 15.8 1.8 10 1.8 10Z" />
    <circle cx="10" cy="10" r="2.6" />
    {off && <path d="M3 17 17 3" />}
  </svg>
);

const clean = (list: HomeSectionEntry[]) => list.map(({ key, hidden }) => ({ key, hidden }));

/** Nombre de lignes d'un tableau dans l'état du formulaire Payload. */
function rowCount(state: unknown): number {
  const s = state as { rows?: unknown[]; value?: unknown } | undefined;
  if (Array.isArray(s?.rows)) return s.rows.length;
  if (typeof s?.value === 'number') return s.value;
  if (Array.isArray(s?.value)) return s.value.length;
  return 0;
}

export function HomeSectionsField(props: JSONFieldClientProps) {
  const { path } = props;
  const { value, setValue, showError, errorMessage, disabled } = useField<unknown>({ path });
  const entries = useMemo(() => resolveHomeSections(value), [value]);

  // Solistes : la section n'apparaît que si des solistes sont choisis.
  const soloistsCount = useFormFields(([fields]) => rowCount(fields?.['featured.soloists']));

  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropGap, setDropGap] = useState<number | null>(null);
  const [announce, setAnnounce] = useState('');

  // Une flèche se désactive quand la section atteint le haut ou le bas : le
  // focus passe alors sur la flèche opposée de la même ligne, au lieu de
  // retomber sur la page.
  const listRef = useRef<HTMLOListElement>(null);
  const pendingFocus = useRef<{ key: string; dir: 'up' | 'down' } | null>(null);
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    listRef.current
      ?.querySelector<HTMLButtonElement>(`li[data-key="${target.key}"] button[data-dir="${target.dir}"]`)
      ?.focus();
  }, [entries]);

  const commit = useCallback(
    (next: HomeSectionEntry[], message?: string) => {
      setValue(clean(next));
      if (message) setAnnounce(message);
    },
    [setValue],
  );

  const move = useCallback(
    (from: number, to: number) => {
      if (from === to || to < 0 || to >= entries.length) return;
      const next = [...entries];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      commit(next, `${homeSectionInfo(item.key).label} : position ${to + 1} sur ${next.length}.`);
    },
    [entries, commit],
  );

  const toggle = useCallback(
    (index: number) => {
      const next = entries.map((e, i) => (i === index ? { ...e, hidden: !e.hidden } : e));
      const item = next[index];
      commit(next, `${homeSectionInfo(item.key).label} : ${item.hidden ? 'masquée' : 'affichée'}.`);
    },
    [entries, commit],
  );

  /**
   * Descend jusqu'aux réglages de la section, les signale un instant et y
   * place le focus (pour continuer au clavier depuis là).
   */
  const goTo = useCallback((group: string) => {
    const el = document.getElementById(`field-${group}`);
    if (!el) return;
    // La barre collante des actions du document couvre le haut de l'écran :
    // le titre de la section s'arrête juste en dessous.
    const bar = document.querySelector<HTMLElement>('.doc-controls');
    el.style.scrollMarginTop = `${(bar?.offsetHeight ?? 0) + 16}px`;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const field = el.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([type="file"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable="true"]',
    );
    if (field && field.offsetParent !== null) {
      field.focus({ preventScroll: true });
    } else {
      if (!el.hasAttribute('tabindex')) el.tabIndex = -1;
      el.focus({ preventScroll: true });
    }
    el.classList.remove('lcs-hsections-flash');
    // Relance l'animation même si l'on clique deux fois de suite.
    void el.offsetWidth;
    el.classList.add('lcs-hsections-flash');
    window.setTimeout(() => el.classList.remove('lcs-hsections-flash'), 1800);
  }, []);

  // ── Glisser-déposer ───────────────────────────────────────────────────
  const onDragStart = (index: number) => (e: DragEvent<HTMLLIElement>) => {
    if (disabled) return;
    setDragFrom(index);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox ne lance pas le glissement sans donnée.
    e.dataTransfer.setData('text/plain', String(index));
  };

  const onDragOver = (index: number) => (e: DragEvent<HTMLLIElement>) => {
    if (dragFrom === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const gap = e.clientY < rect.top + rect.height / 2 ? index : index + 1;
    if (gap !== dropGap) setDropGap(gap);
  };

  const endDrag = () => {
    setDragFrom(null);
    setDropGap(null);
  };

  const onDrop = (e: DragEvent<HTMLOListElement>) => {
    e.preventDefault();
    if (dragFrom !== null && dropGap !== null) {
      const to = dropGap > dragFrom ? dropGap - 1 : dropGap;
      move(dragFrom, to);
    }
    endDrag();
  };

  const visibleCount = entries.filter((e) => !e.hidden).length;

  return (
    <div className="field-type lcs-hsections" id={`field-${path.replace(/\./g, '__')}`}>
      <div className="lcs-hsections__head">
        <div>
          <h3 className="lcs-hsections__title">Sections de la page</h3>
          <p className="lcs-hsections__help">
            Glissez une section pour changer sa place, ou utilisez les flèches. L’œil la masque sans
            rien effacer. L’aperçu suit aussitôt ; enregistrez pour publier.
          </p>
        </div>
        <p className="lcs-hsections__count">
          {visibleCount} section{visibleCount > 1 ? 's' : ''} affichée{visibleCount > 1 ? 's' : ''}
        </p>
      </div>

      <div className="lcs-hsections__row lcs-hsections__row--fixed">
        <span className="lcs-hsections__pos" aria-hidden="true">
          ⌂
        </span>
        <div className="lcs-hsections__text">
          <span className="lcs-hsections__name">{HOME_HERO.label}</span>
          <span className="lcs-hsections__hint">{HOME_HERO.hint}</span>
        </div>
        <div className="lcs-hsections__actions">
          <button type="button" className="lcs-hsections__edit" onClick={() => goTo(HOME_HERO.group)}>
            Modifier
          </button>
        </div>
      </div>

      <ol
        ref={listRef}
        className={`lcs-hsections__list${dragFrom !== null ? ' is-dragging' : ''}`}
        onDrop={onDrop}
        onDragOver={(e) => dragFrom !== null && e.preventDefault()}
      >
        {entries.map((entry, index) => {
          const info = homeSectionInfo(entry.key);
          const empty = entry.key === 'soloists' && soloistsCount === 0;
          const classes = [
            'lcs-hsections__row',
            entry.hidden ? 'is-hidden' : '',
            dragFrom === index ? 'is-dragged' : '',
            dropGap === index && dragFrom !== null ? 'drop-before' : '',
            dropGap === index + 1 && index === entries.length - 1 && dragFrom !== null ? 'drop-after' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <li
              key={entry.key}
              data-key={entry.key}
              className={classes}
              draggable={!disabled}
              onDragStart={onDragStart(index)}
              onDragOver={onDragOver(index)}
              onDragEnd={endDrag}
            >
              <span className="lcs-hsections__grip" title="Glisser pour déplacer" aria-hidden="true">
                <GripIcon />
              </span>
              <span className="lcs-hsections__pos" aria-hidden="true">
                {index + 1}
              </span>
              <div className="lcs-hsections__text">
                <span className="lcs-hsections__name">
                  {info.label}
                  {entry.hidden && <span className="lcs-hsections__badge">Masquée</span>}
                  {!entry.hidden && empty && (
                    <span className="lcs-hsections__badge lcs-hsections__badge--soft">Vide, n’apparaît pas</span>
                  )}
                </span>
                <span className="lcs-hsections__hint">{info.hint}</span>
              </div>
              <div className="lcs-hsections__actions">
                <button
                  type="button"
                  className="lcs-hsections__icon"
                  data-dir="up"
                  onClick={() => {
                    if (index === 1) pendingFocus.current = { key: entry.key, dir: 'down' };
                    move(index, index - 1);
                  }}
                  disabled={disabled || index === 0}
                  aria-label={`Monter « ${info.label} »`}
                  title="Monter"
                >
                  <ArrowIcon up />
                </button>
                <button
                  type="button"
                  className="lcs-hsections__icon"
                  data-dir="down"
                  onClick={() => {
                    if (index === entries.length - 2) pendingFocus.current = { key: entry.key, dir: 'up' };
                    move(index, index + 1);
                  }}
                  disabled={disabled || index === entries.length - 1}
                  aria-label={`Descendre « ${info.label} »`}
                  title="Descendre"
                >
                  <ArrowIcon />
                </button>
                <button
                  type="button"
                  className={`lcs-hsections__icon${entry.hidden ? ' is-off' : ''}`}
                  onClick={() => toggle(index)}
                  disabled={disabled}
                  aria-label={entry.hidden ? `Afficher « ${info.label} »` : `Masquer « ${info.label} »`}
                  title={entry.hidden ? 'Afficher la section' : 'Masquer la section'}
                >
                  <EyeIcon off={entry.hidden} />
                </button>
                <button
                  type="button"
                  className="lcs-hsections__edit"
                  onClick={() => goTo(info.group)}
                  title={`Aller aux réglages de « ${info.label} »`}
                >
                  Modifier
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="lcs-hsections__sr" aria-live="polite">
        {announce}
      </p>

      {showError && errorMessage && (
        <p className="lcs-hsections__error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export default HomeSectionsField;
