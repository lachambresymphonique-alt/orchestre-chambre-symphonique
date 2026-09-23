/**
 * Rubriques du blog.
 *
 * Fichier volontairement sans dépendance Payload : il est importé à la fois
 * par la collection (côté admin) et par les pages du site.
 */
export const POST_CATEGORIES = [
  {
    value: 'projet',
    label: 'Retour sur un projet',
    short: 'Projet',
    plural: 'Projets',
    hint: 'Un concert, une tournée, une création : ce qui s’est passé et ce qu’il en reste.',
  },
  {
    value: 'entretien',
    label: 'Entretien',
    short: 'Entretien',
    plural: 'Entretiens',
    hint: 'Une conversation avec un musicien, un soliste, un partenaire de l’orchestre.',
  },
  {
    value: 'actualite',
    label: 'Actualité',
    short: 'Actualité',
    plural: 'Actualités',
    hint: 'La vie de l’orchestre entre deux concerts.',
  },
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number]['value'];
export type PostCategoryInfo = (typeof POST_CATEGORIES)[number];

export function isPostCategory(value: unknown): value is PostCategory {
  return POST_CATEGORIES.some((c) => c.value === value);
}

/** Infos d’une rubrique ; « Actualité » si la valeur est inconnue. */
export function postCategory(value: unknown): PostCategoryInfo {
  return POST_CATEGORIES.find((c) => c.value === value) ?? POST_CATEGORIES[2];
}
