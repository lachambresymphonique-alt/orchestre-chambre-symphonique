/**
 * Cadrage d'une photo recadrée (object-fit: cover) : le point focal choisi
 * dans la bibliothèque d'images (Payload : focalX / focalY, en %), sinon le
 * repli donné. Payload enregistre 50 / 50 tant que personne n'a choisi de
 * point : ce centre exact est traité comme « non réglé ».
 */
export function objectPositionOf(
  media: { focalX?: number | null; focalY?: number | null } | null | undefined,
  fallback: string,
): string {
  const x = media?.focalX;
  const y = media?.focalY;
  if (typeof x !== 'number' || typeof y !== 'number' || (x === 50 && y === 50)) return fallback;
  return `${x}% ${y}%`;
}
