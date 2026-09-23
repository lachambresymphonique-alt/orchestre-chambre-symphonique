'use client';

import './admin-navigation.css';
import { useEffect, useState } from 'react';
import { useConfig, useField, useRowLabel } from '@payloadcms/ui';
import { BUILTIN_PAGES } from '@/lib/navigation';

type Row = {
  label?: string | null;
  type?: string | null;
  builtin?: string | null;
  page?: number | string | { id?: number | string; value?: number | string } | null;
  url?: string | null;
  newTab?: boolean | null;
  hidden?: boolean | null;
};

/** Page de l'admin liée à une ligne ; null si elle est introuvable. */
type PageInfo = { title: string; slug: string; published: boolean } | null;

const pageCache = new Map<string, Promise<PageInfo>>();

function loadPage(api: string, id: string): Promise<PageInfo> {
  const key = `${api}|${id}`;
  let hit = pageCache.get(key);
  if (!hit) {
    const query = 'depth=0&select[title]=true&select[slug]=true&select[_status]=true';
    hit = fetch(`${api}/pages/${encodeURIComponent(id)}?${query}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((doc) =>
        doc
          ? {
              title: String(doc.title ?? '').trim(),
              slug: String(doc.slug ?? '').trim(),
              // Même règle que le site : seule une page publiée apparaît.
              published: !doc._status || doc._status === 'published',
            }
          : null,
      )
      .catch(() => null);
    // Un échec n'est pas mémorisé : le prochain affichage réessaie.
    hit.then((info) => {
      if (info === null) pageCache.delete(key);
    });
    pageCache.set(key, hit);
  }
  return hit;
}

function pageIdOf(value: Row['page']): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'object') {
    const id = value.id ?? value.value;
    return id === undefined || id === null ? null : String(id);
  }
  return String(value);
}

/** « https://www.helloasso.com/… » → « helloasso.com/… » (lisible, tronqué par le CSS). */
function shortUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
}

type Summary = { name: string; kind: string; dest?: string; warning?: string };

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
  // undefined : pas encore chargée ; null : introuvable.
  const [page, setPage] = useState<PageInfo | undefined>(undefined);

  useEffect(() => {
    setPage(undefined);
    if (!pageId) return;
    let alive = true;
    loadPage(api, pageId).then((info) => {
      if (alive) setPage(info);
    });
    return () => {
      alive = false;
    };
  }, [api, pageId]);

  const hidden = (hiddenValue ?? data?.hidden) === true;
  const label = (data?.label ?? '').trim();
  const summary = summarize(data, label, pageId, page, rowNumber);
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

function summarize(
  data: Row | undefined,
  label: string,
  pageId: string | null,
  page: PageInfo | undefined,
  rowNumber: number | undefined,
): Summary {
  switch (data?.type) {
    case 'builtin': {
      const builtin = BUILTIN_PAGES.find((p) => p.value === data.builtin);
      if (!builtin) return { name: label || 'Page à choisir', kind: 'Page du site', warning: 'À compléter' };
      return { name: label || builtin.label, kind: 'Page du site', dest: builtin.href };
    }
    case 'page': {
      if (!pageId) return { name: label || 'Page à choisir', kind: 'Page de l’admin', warning: 'À compléter' };
      if (page === null) return { name: label || 'Page supprimée', kind: 'Page de l’admin', warning: 'Introuvable' };
      return {
        name: label || page?.title || page?.slug || 'Page de l’admin',
        kind: 'Page de l’admin',
        dest: page?.slug ? `/${page.slug}` : undefined,
        warning: page && !page.published ? 'Non publiée' : undefined,
      };
    }
    case 'custom': {
      const url = (data.url ?? '').trim();
      if (!url || !label) {
        return { name: label || 'Lien à compléter', kind: 'Lien', dest: url ? shortUrl(url) : undefined, warning: 'À compléter' };
      }
      return { name: label, kind: data.newTab ? 'Lien, nouvel onglet' : 'Lien', dest: shortUrl(url) };
    }
    default:
      return { name: `Entrée ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`, kind: 'À compléter' };
  }
}

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.6,
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path {...stroke} d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle {...stroke} cx="12" cy="12" r="2.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path {...stroke} d="M10.6 5.6A10 10 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 01-2.6 3.4" />
      <path {...stroke} d="M6.6 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.9 0 3.5-.6 4.9-1.5" />
      <path {...stroke} d="M9.9 9.9a2.8 2.8 0 004 4" />
      <path {...stroke} d="M3.5 3.5l17 17" />
    </svg>
  );
}

export default NavItemRowLabel;
