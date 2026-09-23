/**
 * Menu principal du site.
 *
 * Le menu se compose dans l'admin (Réglages → Menu du site). Chaque entrée
 * pointe vers une page fixe du site, une page créée dans l'admin (collection
 * `pages`) ou une adresse libre, et peut être masquée sans être supprimée.
 * Tant que le menu n'a pas été configuré, on
 * retombe sur le menu historique : les pages fixes, plus les pages de l'admin
 * cochées « Afficher dans la navigation ».
 *
 * Module pur (aucune dépendance serveur) : utilisé par le layout, le Header,
 * la config du global et le libellé des lignes dans l'admin.
 */

export type NavLink = {
  href: string;
  label: string;
  /** Adresse hors du site (https://…, mailto:…) : rendue avec <a>, pas <Link>. */
  external?: boolean;
  newTab?: boolean;
};

/** Pages fixes du site, proposées dans l'admin. `value` est la clé enregistrée en base. */
export const BUILTIN_PAGES = [
  { value: 'home', href: '/', label: 'Accueil' },
  { value: 'about', href: '/a-propos', label: 'À propos' },
  { value: 'director', href: '/directeur-artistique', label: 'Direction' },
  { value: 'musicians', href: '/musiciens', label: 'Musiciens' },
  { value: 'medias', href: '/medias', label: 'Médias' },
  { value: 'support', href: '/nous-soutenir', label: 'Nous soutenir' },
  { value: 'contact', href: '/contact', label: 'Contact' },
] as const;

export type BuiltinPageKey = (typeof BUILTIN_PAGES)[number]['value'];

/** Menu historique, avant toute configuration dans l'admin. */
export const DEFAULT_NAV_ITEMS: NavLink[] = BUILTIN_PAGES.map(({ href, label }) => ({ href, label }));

/** Une page de l'admin telle que peuplée dans une relation (depth ≥ 1). */
export type NavPageDoc = {
  slug?: string | null;
  title?: string | null;
  _status?: string | null;
};

/** Une ligne du tableau « Entrées du menu » du global `navigation`. */
export type NavigationItemDoc = {
  label?: string | null;
  type?: 'builtin' | 'page' | 'custom' | string | null;
  builtin?: string | null;
  page?: NavPageDoc | number | string | null;
  url?: string | null;
  newTab?: boolean | null;
  /** Masquée : conservée dans l'admin mais absente du menu du site. */
  hidden?: boolean | null;
};

export type NavigationDoc = { items?: NavigationItemDoc[] | null } | null | undefined;

/** Une adresse est interne au site si elle commence par un seul « / ». */
export function isInternalHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

/**
 * Transforme le global `navigation` (relations peuplées, depth ≥ 1) en liens.
 * Les entrées incomplètes, les pages non publiées ou supprimées sont ignorées.
 */
export function resolveNavItems(nav: NavigationDoc): NavLink[] {
  const items = Array.isArray(nav?.items) ? nav.items : [];
  const links: NavLink[] = [];

  for (const item of items) {
    if (item?.hidden === true) continue;
    const label = (item?.label ?? '').trim();

    switch (item?.type) {
      case 'builtin': {
        const page = BUILTIN_PAGES.find((p) => p.value === item.builtin);
        if (!page) break;
        links.push({ href: page.href, label: label || page.label });
        break;
      }
      case 'page': {
        const page = item.page;
        // Non peuplée (depth 0) ou supprimée : on ne peut rien afficher.
        if (!page || typeof page !== 'object') break;
        if (page._status && page._status !== 'published') break;
        const slug = (page.slug ?? '').trim();
        if (!slug) break;
        links.push({ href: `/${slug}`, label: label || (page.title ?? '').trim() || slug });
        break;
      }
      case 'custom': {
        const url = (item.url ?? '').trim();
        if (!url || !label) break;
        const link: NavLink = { href: url, label };
        if (!isInternalHref(url)) link.external = true;
        if (item.newTab) link.newTab = true;
        links.push(link);
        break;
      }
      default:
        break;
    }
  }

  return links;
}

/**
 * Le menu a-t-il été composé dans l'admin ? Oui dès qu'il contient une ligne,
 * même masquée : un menu dont toutes les entrées sont masquées reste vide au
 * lieu de retomber sur le menu historique.
 */
export function isNavConfigured(nav: NavigationDoc): boolean {
  return Array.isArray(nav?.items) && nav.items.length > 0;
}

/** Une page de l'admin avec les anciens champs de navigation (menu historique). */
export type LegacyNavPage = {
  slug?: string | null;
  title?: string | null;
  navLabel?: string | null;
  navOrder?: number | null;
};

/**
 * Menu historique : pages fixes (ordre 1 à 7) puis pages de l'admin cochées
 * « Afficher dans la navigation », insérées selon leur « Ordre dans le menu ».
 */
export function legacyNavItems(pages: LegacyNavPage[]): NavLink[] {
  const builtin = BUILTIN_PAGES.map((p, i) => ({ href: p.href, label: p.label, order: i + 1 }));
  const extra = pages
    .filter((p) => typeof p.slug === 'string' && p.slug.trim().length > 0)
    .map((p) => ({
      href: `/${p.slug!.trim()}`,
      label: (p.navLabel || p.title || p.slug) as string,
      order: p.navOrder ?? 99,
    }));

  return [...builtin, ...extra]
    .sort((a, b) => a.order - b.order)
    .map(({ href, label }) => ({ href, label }));
}
