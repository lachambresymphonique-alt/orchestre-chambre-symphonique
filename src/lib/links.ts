/**
 * Adresses web saisies à la main (site d'un musicien, liens vers ses projets).
 *
 * On tape rarement « https:// » : `normalizeUrl` l'ajoute, et refuse ce qui
 * n'est pas une adresse web. Tout lien affiché sur le site passe par elle, si
 * bien qu'une valeur douteuse en base ne devient jamais un lien cliquable.
 *
 * Chargé par l'admin comme par le site : ne dépend de rien.
 */

/** Adresse complète (https://…), ou '' si la saisie n'est pas une adresse web. */
export function normalizeUrl(input: unknown): string {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw || /\s/.test(raw)) return '';
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, '')}`;
  try {
    const url = new URL(candidate);
    // « https://mailto:nom@site.fr » se lit comme un site avec identifiants : refusé.
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return '';
    if (!/^[^.]+(\.[^.]+)+$/.test(url.hostname)) return '';
    return candidate;
  } catch {
    return '';
  }
}

/** Adresse telle qu'on la lit : sans « https:// », sans « www. », sans barre finale. */
export function shortUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '');
}

/** Message commun aux formulaires et à l'admin. */
export const URL_HINT = 'indiquez une adresse web, par exemple www.monsite.fr';

/**
 * Adresses web complétées (« https:// »), une par ligne, sans doublon.
 * `invalid` : première ligne qui n'est pas une adresse web.
 */
export function normalizeLinks(value: string): { value: string; invalid: string | null } {
  const urls: string[] = [];
  for (const line of splitLines(value)) {
    const url = normalizeUrl(line);
    if (!url) return { value, invalid: line };
    if (!urls.includes(url)) urls.push(url);
  }
  return { value: urls.join('\n'), invalid: null };
}

type Rows = { item?: string | null }[] | null | undefined;

/** Liste de liens (une ligne = un lien) réduite aux adresses valides, sans doublon. */
export function linkList(rows: Rows): string[] {
  const urls = (rows ?? []).map((row) => normalizeUrl(row?.item)).filter(Boolean);
  return [...new Set(urls)];
}

/** Texte multiligne → lignes non vides. */
export function splitLines(text: unknown): string[] {
  if (typeof text !== 'string') return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
