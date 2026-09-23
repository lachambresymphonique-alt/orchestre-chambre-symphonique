'use client';

import './admin-navigation.css';
import './admin-nav-tree.css';
import { useCallback, useState } from 'react';
import type { DragEvent } from 'react';
import { RenderFields, useConfig, useForm, useFormFields } from '@payloadcms/ui';
import type { ArrayFieldClientComponent } from 'payload';
import {
  ChevronIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  GripIcon,
  TrashIcon,
  pageIdOf,
  summarizeNavEntry,
  usePageInfo,
  type NavEntryRow,
} from './navEntry';
import {
  blockSize,
  depthChanges,
  indentBlocker,
  wantedDepth,
  moveSteps,
  normalizeDepth,
  orphansAfterRemoval,
  planMove,
  projectDepth,
} from './navTreeMoves';

/** Glissement horizontal, en pixels, à partir duquel on change de niveau. */
const INDENT_TRIGGER = 28;

type Entry = {
  id: string;
  depth: 0 | 1;
  hidden: boolean;
  /** Un champ de la ligne a été refusé : la ligne est repliée, il faut le dire. */
  invalid: boolean;
  data: NavEntryRow;
};

/** Champs dont l'échec de validation doit remonter sur la ligne repliée. */
const CHECKED_FIELDS = ['type', 'label', 'builtin', 'page', 'url'];

type Drag = { from: number; size: number; startX: number };
type Drop = { gap: number; depth: 0 | 1; wanted: 0 | 1 };

/**
 * Éditeur du menu du site (global `navigation`, champ « items »).
 *
 * Une seule liste, à plat, où chaque ligne porte son niveau : on glisse une
 * ligne pour la déplacer, et on la glisse vers la droite pour la ranger sous
 * l'entrée du dessus — qui devient alors le titre d'un sous-menu. Les mêmes
 * déplacements sont accessibles au clavier par les boutons de niveau.
 *
 * Le formulaire reste celui de Payload : déplier une ligne affiche ses champs
 * habituels (RenderFields), avec leurs validations. Ce composant ne fait que
 * remplacer la mise en page du tableau et piloter l'ordre et le niveau.
 */
export const NavTree: ArrayFieldClientComponent = ({ field, path, permissions, readOnly, schemaPath }) => {
  const { addFieldRow, dispatchFields, moveFieldRow, removeFieldRow, setModified } = useForm();
  // Chemin de schéma du tableau : Payload le fournit, on garde un repli sûr.
  const fieldSchemaPath = schemaPath ?? path;
  const fieldPermissions = permissions === true ? permissions : (permissions?.fields ?? {});

  const entries = useFormFields(([fields]) => {
    const rows = (fields[path]?.rows ?? []) as { id?: string }[];
    return rows.map((row, i): Entry => {
      const at = (name: string) => fields[`${path}.${i}.${name}`]?.value;
      const hidden = at('hidden') === true;
      return {
        id: row?.id ?? `row-${i}`,
        depth: normalizeDepth(at('depth')),
        hidden,
        invalid: CHECKED_FIELDS.some((name) => fields[`${path}.${i}.${name}`]?.valid === false),
        data: {
          label: (at('label') ?? '') as string,
          type: (at('type') ?? '') as string,
          builtin: (at('builtin') ?? null) as string | null,
          page: (at('page') ?? null) as NavEntryRow['page'],
          url: (at('url') ?? '') as string,
          newTab: at('newTab') === true,
          hidden,
        },
      };
    });
  });

  const depths = entries.map((entry) => entry.depth);
  const [open, setOpen] = useState<string[]>([]);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);

  const toggleOpen = (id: string) =>
    setOpen((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const setDepth = useCallback(
    (index: number, depth: 0 | 1) => {
      dispatchFields({ type: 'UPDATE', path: `${path}.${index}.depth`, value: depth });
      setModified(true);
    },
    [dispatchFields, path, setModified],
  );

  /** Remet les lignes dans l'ordre voulu, puis corrige les niveaux touchés. */
  const applyMove = useCallback(
    (from: number, gap: number, wanted: number) => {
      const before = [...depths];
      const plan = planMove(before, from, gap, wanted);
      for (const step of moveSteps(plan.order)) {
        moveFieldRow({ path, moveFromIndex: step.from, moveToIndex: step.to });
      }
      for (const change of depthChanges(before, plan)) {
        dispatchFields({ type: 'UPDATE', path: `${path}.${change.index}.depth`, value: change.depth });
      }
      setModified(true);
    },
    [depths, dispatchFields, moveFieldRow, path, setModified],
  );

  const onDragStart = (event: DragEvent<HTMLLIElement>, index: number) => {
    if (readOnly) return;
    event.dataTransfer.effectAllowed = 'move';
    // Firefox n'entame pas le glissement sans données transportées.
    event.dataTransfer.setData('text/plain', String(index));
    setDrag({ from: index, size: blockSize(depths, index), startX: event.clientX });
  };

  const onDragOver = (event: DragEvent<HTMLLIElement>, index: number) => {
    if (!drag) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const rect = event.currentTarget.getBoundingClientRect();
    const gap = event.clientY < rect.top + rect.height / 2 ? index : index + 1;

    // La ligne prend le niveau de celle qu'on survole : survoler un sous-lien,
    // c'est entrer dans son sous-menu. Le glissement horizontal corrige d'un
    // cran — vers la droite on imbrique, vers la gauche on ressort.
    const delta = event.clientX - drag.startX;
    const step = delta > INDENT_TRIGGER ? 1 : delta < -INDENT_TRIGGER ? -1 : 0;
    // Un titre n'a pas d'adresse : rangé dans un sous-menu, il n'y mènerait
    // nulle part. Il reste donc au premier niveau.
    const wanted = entries[drag.from]?.data.type === 'group' ? 0 : wantedDepth(depths, index, step);

    const depth = projectDepth(depths, drag.from, gap, wanted);
    setDrop((current) =>
      current?.gap === gap && current.depth === depth && current.wanted === wanted
        ? current
        : { gap, depth, wanted },
    );
  };

  const endDrag = () => {
    setDrag(null);
    setDrop(null);
  };

  const onDrop = (event: DragEvent<HTMLLIElement>) => {
    event.preventDefault();
    if (drag && drop) applyMove(drag.from, drop.gap, drop.wanted);
    endDrag();
  };

  const addEntry = async () => {
    await addFieldRow({ path, rowIndex: entries.length, schemaPath: fieldSchemaPath });
    setModified(true);
  };

  const duplicateEntry = (index: number) => {
    dispatchFields({ type: 'DUPLICATE_ROW', path, rowIndex: index });
    setModified(true);
  };

  const removeEntry = (index: number) => {
    // Les sous-liens d'une entrée supprimée remontent au premier niveau plutôt
    // que de se retrouver rattachés à l'entrée d'au-dessus.
    for (const orphan of orphansAfterRemoval(depths, index)) setDepth(orphan, 0);
    removeFieldRow({ path, rowIndex: index });
  };

  const toggleHidden = (index: number, hidden: boolean) => {
    dispatchFields({ type: 'UPDATE', path: `${path}.${index}.hidden`, value: !hidden });
    setModified(true);
  };

  const shown = entries.filter((entry) => !entry.hidden).length;
  const masked = entries.length - shown;
  const label = typeof field?.label === 'string' ? field.label : 'Entrées du menu';

  return (
    <div className="lcs-navtree" role="group" aria-label={label}>
      <div className="lcs-navtree__head">
        <div>
          <h3 className="lcs-navtree__title">{label}</h3>
          <p className="lcs-navtree__count">
            {entries.length === 0
              ? 'Aucune entrée pour l’instant'
              : `${shown} entrée${shown > 1 ? 's' : ''} affichée${shown > 1 ? 's' : ''}${
                  masked > 0 ? ` · ${masked} masquée${masked > 1 ? 's' : ''}` : ''
                }`}
          </p>
        </div>
        <button type="button" className="lcs-navtree__add" onClick={addEntry} disabled={readOnly}>
          + Ajouter une entrée
        </button>
      </div>

      <p className="lcs-navtree__help">
        Glissez une ligne pour la déplacer : elle prend le niveau de celle que vous survolez. Déposée
        sur un lien déjà rangé dans un sous-menu, elle rejoint ce sous-menu ; si elle avait elle-même
        des liens, ils l’y suivent. Les flèches ← → font la même chose au clavier.
      </p>

      {entries.length === 0 ? (
        <p className="lcs-navtree__empty">
          Tant que le menu est vide, le site affiche ses pages dans l’ordre d’origine.
        </p>
      ) : (
        <ol className="lcs-navtree__list">
          {entries.map((entry, index) => {
            const dragging = !!drag && index >= drag.from && index < drag.from + drag.size;
            const last = index === entries.length - 1;
            const classes = [
              'lcs-navtree__row',
              entry.depth === 1 ? 'is-child' : '',
              entry.hidden ? 'is-hidden' : '',
              entry.invalid ? 'is-invalid' : '',
              dragging ? 'is-dragging' : '',
              drop?.gap === index ? 'is-drop-before' : '',
              last && drop?.gap === entries.length ? 'is-drop-after' : '',
              open.includes(entry.id) ? 'is-open' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <li
                key={entry.id}
                className={classes}
                style={{ ['--lcs-drop-indent' as string]: `${(drop?.depth ?? 0) * 1.75}rem` }}
                draggable={!readOnly}
                onDragStart={(event) => onDragStart(event, index)}
                onDragOver={(event) => onDragOver(event, index)}
                onDrop={onDrop}
                onDragEnd={endDrag}
              >
                <NavTreeRow
                  entry={entry}
                  index={index}
                  childCount={entry.depth === 0 ? blockSize(depths, index) - 1 : 0}
                  indentBlocker={
                    readOnly
                      ? 'Vous n’avez pas la main sur ce menu.'
                      : entry.data.type === 'group'
                        ? 'Un titre de sous-menu n’a pas d’adresse : il ne peut pas être rangé dans un autre sous-menu.'
                        : indentBlocker(depths, index)
                  }
                  canOutdent={!readOnly && entry.depth === 1}
                  open={open.includes(entry.id)}
                  readOnly={!!readOnly}
                  onToggleOpen={() => toggleOpen(entry.id)}
                  onToggleHidden={() => toggleHidden(index, entry.hidden)}
                  onIndent={() => setDepth(index, 1)}
                  onOutdent={() => setDepth(index, 0)}
                  onDuplicate={() => duplicateEntry(index)}
                  onRemove={() => removeEntry(index)}
                />

                {open.includes(entry.id) && (
                  <div className="lcs-navtree__form">
                    <RenderFields
                      fields={field.fields}
                      margins="small"
                      parentIndexPath=""
                      parentPath={`${path}.${index}`}
                      parentSchemaPath={fieldSchemaPath}
                      permissions={fieldPermissions}
                      readOnly={readOnly}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

type RowProps = {
  entry: Entry;
  index: number;
  childCount: number;
  /** Raison pour laquelle l'entrée ne peut pas être rangée d'un cran, s'il y en a une. */
  indentBlocker: string | null;
  canOutdent: boolean;
  open: boolean;
  readOnly: boolean;
  onToggleOpen: () => void;
  onToggleHidden: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
};

/** La ligne repliée : ce qu'on lit d'un coup d'œil, et ses boutons. */
function NavTreeRow({
  entry,
  index,
  childCount,
  indentBlocker: indentBlocked,
  canOutdent,
  open,
  readOnly,
  onToggleOpen,
  onToggleHidden,
  onIndent,
  onOutdent,
  onDuplicate,
  onRemove,
}: RowProps) {
  const { config } = useConfig();
  const api = `${config.serverURL ?? ''}${config.routes?.api ?? '/api'}`;
  const pageId = entry.data.type === 'page' ? pageIdOf(entry.data.page) : null;
  const page = usePageInfo(api, pageId);

  const summary = summarizeNavEntry(entry.data, pageId, page, index, childCount);

  return (
    <div className="lcs-navtree__line">
      <span className="lcs-navtree__grip" aria-hidden="true" title="Glisser pour déplacer">
        <GripIcon />
      </span>

      <button
        type="button"
        className="lcs-navtree__disclose"
        onClick={onToggleOpen}
        aria-expanded={open}
        aria-label={`${open ? 'Replier' : 'Modifier'} « ${summary.name} »`}
      >
        <span className="lcs-navtree__name">{summary.name}</span>
        {entry.hidden && <span className="lcs-navrow__pill is-hidden">Masquée</span>}
        {entry.invalid ? (
          <span className="lcs-navrow__pill is-warning">À corriger</span>
        ) : (
          summary.warning && <span className="lcs-navrow__pill is-warning">{summary.warning}</span>
        )}
        <span className="lcs-navtree__meta">
          {summary.kind}
          {summary.dest ? ` · ${summary.dest}` : ''}
        </span>
        <span className={`lcs-navtree__chevron${open ? ' is-open' : ''}`}>
          <ChevronIcon />
        </span>
      </button>

      <span className="lcs-navtree__actions">
        <button
          type="button"
          className="lcs-navtree__icon"
          onClick={onOutdent}
          disabled={!canOutdent}
          title="Remonter d’un niveau"
          aria-label={`Sortir « ${summary.name} » du sous-menu`}
        >
          ←
        </button>
        <button
          type="button"
          className="lcs-navtree__icon"
          onClick={onIndent}
          disabled={!!indentBlocked}
          title={indentBlocked ?? 'Ranger sous l’entrée du dessus'}
          aria-label={`Ranger « ${summary.name} » sous l’entrée du dessus`}
        >
          →
        </button>
        <button
          type="button"
          className="lcs-navtree__icon"
          onClick={onToggleHidden}
          disabled={readOnly}
          title={entry.hidden ? 'Réafficher dans le menu du site' : 'Retirer du menu sans supprimer'}
          aria-label={`${entry.hidden ? 'Afficher' : 'Masquer'} « ${summary.name} »`}
        >
          {entry.hidden ? <EyeIcon /> : <EyeOffIcon />}
        </button>
        <button
          type="button"
          className="lcs-navtree__icon"
          onClick={onDuplicate}
          disabled={readOnly}
          title="Dupliquer cette entrée"
          aria-label={`Dupliquer « ${summary.name} »`}
        >
          <CopyIcon />
        </button>
        <button
          type="button"
          className="lcs-navtree__icon is-danger"
          onClick={onRemove}
          disabled={readOnly}
          title="Supprimer cette entrée"
          aria-label={`Supprimer « ${summary.name} »`}
        >
          <TrashIcon />
        </button>
      </span>
    </div>
  );
}

export default NavTree;
