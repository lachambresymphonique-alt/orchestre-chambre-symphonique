'use client';

import { useEffect, useState } from 'react';
import { BUILTIN_PAGES } from '@/lib/navigation';

/**
 * Ce qu'une entrée du menu raconte d'elle-même : de quoi écrire une ligne
 * lisible sans la déplier. Partagé par l'éditeur (NavTree) et par l'ancien
 * libellé de ligne (NavItemRowLabel).
 */

export type NavEntryRow = {
  label?: string | null;
  type?: string | null;
  builtin?: string | null;
  page?: number | string | { id?: number | string; value?: number | string } | null;
  url?: string | null;
  newTab?: boolean | null;
  hidden?: boolean | null;
};

/** Page de l'admin liée à une entrée ; null si elle est introuvable. */
export type PageInfo = { title: string; slug: string; published: boolean } | null;

const pageCache = new Map<string, Promise<PageInfo>>();

/** Charge le titre et l'état d'une page de l'admin, une seule fois par page. */
export function loadPage(api: string, id: string): Promise<PageInfo> {
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

/**
 * Page de l'admin liée à une entrée : `undefined` tant qu'elle n'est pas
 * chargée, `null` si elle est introuvable. La réponse est rangée avec son
 * identifiant, pour ne jamais afficher la page d'une autre ligne.
 */
export function usePageInfo(api: string, pageId: string | null): PageInfo | undefined {
  const [loaded, setLoaded] = useState<{ id: string; info: PageInfo } | null>(null);

  useEffect(() => {
    if (!pageId) return;
    let alive = true;
    loadPage(api, pageId).then((info) => {
      if (alive) setLoaded({ id: pageId, info });
    });
    return () => {
      alive = false;
    };
  }, [api, pageId]);

  return pageId && loaded?.id === pageId ? loaded.info : undefined;
}

export function pageIdOf(value: NavEntryRow['page']): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'object') {
    const id = value.id ?? value.value;
    return id === undefined || id === null ? null : String(id);
  }
  return String(value);
}

/** « https://www.helloasso.com/… » → « helloasso.com/… » (lisible, tronqué par le CSS). */
export function shortUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
}

export type NavSummary = { name: string; kind: string; dest?: string; warning?: string };

/**
 * Résumé d'une entrée : nom affiché, nature, destination, et l'avertissement
 * qui explique pourquoi elle n'apparaîtrait pas sur le site.
 *
 * `childCount` est le nombre de sous-liens rattachés à l'entrée — dans la
 * liste, les lignes de niveau 2 qui la suivent.
 */
export function summarizeNavEntry(
  data: NavEntryRow | undefined,
  pageId: string | null,
  page: PageInfo | undefined,
  rowNumber?: number,
  childCount = 0,
): NavSummary {
  const label = (data?.label ?? '').trim();
  // Une entrée qui a des liens rangés sous elle le dit : sinon rien, sur la
  // ligne repliée, n'explique qu'elle est devenue le titre d'un sous-menu.
  const sub = childCount > 0 ? `${childCount} lien${childCount > 1 ? 's' : ''} dessous` : '';
  const withSub = (dest?: string) => [dest, sub].filter(Boolean).join(' · ') || undefined;

  switch (data?.type) {
    case 'builtin': {
      const builtin = BUILTIN_PAGES.find((p) => p.value === data.builtin);
      if (!builtin) return { name: label || 'Page à choisir', kind: 'Page du site', warning: 'À compléter' };
      return { name: label || builtin.label, kind: 'Page du site', dest: withSub(builtin.href) };
    }
    case 'page': {
      if (!pageId) return { name: label || 'Page à choisir', kind: 'Page de l’admin', warning: 'À compléter' };
      if (page === null) return { name: label || 'Page supprimée', kind: 'Page de l’admin', warning: 'Introuvable' };
      return {
        name: label || page?.title || page?.slug || 'Page de l’admin',
        kind: 'Page de l’admin',
        dest: withSub(page?.slug ? `/${page.slug}` : undefined),
        warning: page && !page.published ? 'Non publiée' : undefined,
      };
    }
    case 'group': {
      const kind = 'Titre de sous-menu';
      if (!label) return { name: 'Titre sans texte', kind, warning: 'À compléter' };
      // Un titre sans rien sous lui n'ouvre aucun menu : il n'apparaît pas.
      if (childCount === 0) return { name: label, kind, warning: 'Aucun lien dessous' };
      return { name: label, kind, dest: sub };
    }
    case 'custom': {
      const url = (data.url ?? '').trim();
      if (!url || !label) {
        return { name: label || 'Lien à compléter', kind: 'Lien', dest: url ? shortUrl(url) : undefined, warning: 'À compléter' };
      }
      return { name: label, kind: data.newTab ? 'Lien, nouvel onglet' : 'Lien', dest: withSub(shortUrl(url)) };
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

export function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path {...stroke} d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle {...stroke} cx="12" cy="12" r="2.8" />
    </svg>
  );
}

export function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path {...stroke} d="M10.6 5.6A10 10 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 01-2.6 3.4" />
      <path {...stroke} d="M6.6 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.9 0 3.5-.6 4.9-1.5" />
      <path {...stroke} d="M9.9 9.9a2.8 2.8 0 004 4" />
      <path {...stroke} d="M3.5 3.5l17 17" />
    </svg>
  );
}

export function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="6" cy="3.5" r="1.3" />
        <circle cx="10" cy="3.5" r="1.3" />
        <circle cx="6" cy="8" r="1.3" />
        <circle cx="10" cy="8" r="1.3" />
        <circle cx="6" cy="12.5" r="1.3" />
        <circle cx="10" cy="12.5" r="1.3" />
      </g>
    </svg>
  );
}

export function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path {...stroke} d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path {...stroke} d="M4 7h16M10 7V5h4v2M6 7l1 12h10l1-12" />
    </svg>
  );
}

export function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <rect {...stroke} x="9" y="9" width="11" height="11" rx="2" />
      <path {...stroke} d="M5 15V6a1 1 0 011-1h9" />
    </svg>
  );
}
