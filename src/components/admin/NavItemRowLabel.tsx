'use client';

import './admin-navigation.css';
import { useConfig, useField, useRowLabel } from '@payloadcms/ui';
import {
  EyeIcon,
  EyeOffIcon,
  pageIdOf,
  summarizeNavEntry,
  usePageInfo,
  type NavEntryRow,
} from './navEntry';

type Row = NavEntryRow & { children?: NavEntryRow[] | null };

/**
 * Titre d'une ligne repliée de « Menu du site » : texte affiché, type et
 * adresse de l'entrée, état (masquée, page à choisir, non publiée…), et un
 * bouton « Masquer / Afficher » qui bascule la case de la ligne sans avoir à
 * la déplier. Le changement est enregistré avec le bouton « Enregistrer ».
 */
export function NavItemRowLabel() {
  const { data, path, rowNumber } = useRowLabel<Row>();
  const { value: hiddenValue, setValue: setHidden } = useField<boolean | null>({ path: `${path}.hidden` });
  const { config } = useConfig();
  const api = `${config.serverURL ?? ''}${config.routes?.api ?? '/api'}`;

  const pageId = data?.type === 'page' ? pageIdOf(data.page) : null;
  const page = usePageInfo(api, pageId);

  const hidden = (hiddenValue ?? data?.hidden) === true;
  const children = Array.isArray(data?.children) ? data.children : [];
  const summary = summarizeNavEntry(data, pageId, page, rowNumber, children.filter((l) => l?.hidden !== true).length);
  const action = hidden ? 'Afficher' : 'Masquer';

  return (
    <div className={`lcs-navrow${hidden ? ' is-hidden' : ''}`}>
      <span className="lcs-navrow__name">{summary.name}</span>
      {hidden && <span className="lcs-navrow__pill is-hidden">Masquée</span>}
      {summary.warning && <span className="lcs-navrow__pill is-warning">{summary.warning}</span>}
      <span className="lcs-navrow__meta">
        {summary.kind}
        {summary.dest ? ` · ${summary.dest}` : ''}
      </span>
      <button
        type="button"
        className="lcs-navrow__toggle"
        onClick={() => setHidden(!hidden)}
        title={hidden ? 'Réafficher cette entrée dans le menu du site' : 'Retirer cette entrée du menu sans la supprimer'}
        aria-label={`${action} « ${summary.name} » ${hidden ? 'dans le' : 'du'} menu`}
      >
        {hidden ? <EyeIcon /> : <EyeOffIcon />}
        <span className="lcs-navrow__toggle-text">{action}</span>
      </button>
    </div>
  );
}

export default NavItemRowLabel;
