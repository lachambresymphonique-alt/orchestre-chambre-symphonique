/**
 * Statut des fiches musiciens (champ « Statut » de la collection musicians).
 *
 * Seules les fiches « En ligne » apparaissent sur le site public : page
 * Musiciens, accueil, page du musicien, plan du site. Les autres restent dans
 * l'admin. Une fiche sans statut (antérieure à ce réglage) compte comme en
 * ligne. Les libellés se changent librement ; les valeurs, non (elles sont en base).
 */

export const MUSICIAN_STATUSES = [
  { value: 'published', label: 'En ligne', tone: 'online' },
  { value: 'draft', label: 'Brouillon', tone: 'draft' },
  { value: 'hidden', label: 'Masquée', tone: 'hidden' },
  { value: 'former', label: 'Ancien membre', tone: 'former' },
] as const;

export type MusicianStatus = (typeof MUSICIAN_STATUSES)[number]['value'];

/** Statut d'une nouvelle fiche : elle ne paraît qu'une fois mise « En ligne ». */
export const NEW_MUSICIAN_STATUS: MusicianStatus = 'draft';

export function musicianStatus(value: unknown) {
  return MUSICIAN_STATUSES.find((s) => s.value === value) ?? MUSICIAN_STATUSES[0];
}

export const isMusicianPublic = (m: { status?: string | null } | null | undefined): boolean =>
  !m?.status || m.status === 'published';

/** Filtre Payload des fiches visibles sur le site, à combiner avec un autre filtre si besoin. */
export function publicMusicians(where?: Record<string, unknown>) {
  const visible = { or: [{ status: { exists: false } }, { status: { equals: 'published' } }] };
  return where ? { and: [where, visible] } : visible;
}
