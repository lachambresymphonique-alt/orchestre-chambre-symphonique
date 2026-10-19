/**
 * Visuel de repli des personnes sans photo.
 *
 * Le fichier porte encore le nom des photos d'illustration Unsplash qu'il
 * fournissait : elles ont été retirées (la moitié avaient disparu du service,
 * et l'adresse Unsplash autorisée dans next.config laissait n'importe qui faire
 * transformer des images sur le quota du site).
 */

/**
 * Visuel d'un musicien sans photo : ses initiales, sur fond sombre, dans une
 * image SVG embarquée (aucune requête, rien qui puisse casser). Remplace les
 * photos d'illustration Unsplash, qui ne montraient pas la personne et dont
 * plusieurs ont disparu du service.
 */
export function placeholderForMusician(seed: string): string {
  const words = (seed || '').trim().split(/[\s-]+/).filter(Boolean);
  const letters = ((words[0]?.[0] ?? '') + (words.length > 1 ? words[words.length - 1][0] : ''))
    .toUpperCase()
    .replace(/[^\p{L}]/gu, '');
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">' +
    '<rect width="400" height="500" fill="#15110e"/>' +
    '<circle cx="200" cy="235" r="118" fill="none" stroke="#c9a45c" stroke-opacity="0.35" stroke-width="2"/>' +
    '<text x="200" y="270" text-anchor="middle" font-family="Georgia, \'Times New Roman\', serif" font-style="italic" font-size="104" fill="#d8b26a">' +
    (letters || '♪') +
    '</text></svg>';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
