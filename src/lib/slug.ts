/** Texte → ASCII minuscule sans accents ; les ligatures sont dépliées (« chœur » → « choeur »). */
export const foldAscii = (s: string): string =>
  s
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'OE')
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'AE')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** « Mozart à Tournus — juin 2024 » → « mozart-a-tournus-juin-2024 » */
export const slugify = (s: string): string =>
  s
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'OE')
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'AE')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
