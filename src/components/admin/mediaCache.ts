/**
 * Fiches de la Bibliothèque d'images demandées par les cellules des listes de
 * l'admin (MusicianCells, MediaCells), partagées entre les lignes : une seule
 * requête par image, même si elle apparaît plusieurs fois.
 */

type MediaFile = { url?: string | null; width?: number | null; height?: number | null };

export type MediaDoc = MediaFile & {
  id: number | string;
  alt?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  focalX?: number | null;
  focalY?: number | null;
  sizes?: Record<string, MediaFile | null | undefined> | null;
};

const cache = new Map<string, Promise<MediaDoc | null>>();

export function loadMedia(id: string): Promise<MediaDoc | null> {
  if (!cache.has(id)) {
    cache.set(
      id,
      fetch(`/api/media/${encodeURIComponent(id)}?depth=0`, { credentials: 'include' })
        .then((res) => (res.ok ? (res.json() as Promise<MediaDoc>) : null))
        .catch(() => null)
        .then((media) => {
          // Un échec n'est pas retenu : l'image sera redemandée au prochain affichage.
          if (!media) cache.delete(id);
          return media;
        }),
    );
  }
  return cache.get(id)!;
}

/** Fiche déjà fournie par la ligne (objet), sinon son identifiant à charger. */
export function mediaFromCell(cellData: unknown): { media: MediaDoc | null; id: string } {
  if (cellData && typeof cellData === 'object' && 'url' in (cellData as object)) return { media: cellData as MediaDoc, id: '' };
  return { media: null, id: cellData == null || cellData === '' ? '' : String(cellData) };
}

/** Vignette légère (format « thumbnail » de Payload, 400 × 300), sinon l'original (SVG). */
export function thumbnailOf(media: MediaDoc | null | undefined): string | null {
  return media?.sizes?.thumbnail?.url || media?.url || null;
}
