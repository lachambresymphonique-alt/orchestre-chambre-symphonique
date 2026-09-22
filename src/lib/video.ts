/**
 * Vidéos externes (YouTube / Vimeo) — détection du fournisseur, URL d'embed
 * et miniature dérivée automatiquement à partir du champ `url` d'un média.
 *
 * Permet d'afficher un aperçu même quand aucune miniature n'a été uploadée
 * dans l'admin.
 */

export type VideoProvider = 'youtube' | 'vimeo';

export type VideoInfo = {
  provider: VideoProvider;
  id: string;
  /** URL à charger dans une iframe (autoplay, sans cookies pour YouTube). */
  embedUrl: string;
  /** Miniature de meilleure qualité connue (peut ne pas exister pour YouTube). */
  thumbnailUrl: string | null;
  /** Miniature de repli, garantie d'exister (YouTube uniquement). */
  thumbnailFallbackUrl: string | null;
};

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\.|^m\./, '');

  if (host === 'youtu.be') {
    return url.pathname.split('/').filter(Boolean)[0] ?? null;
  }

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const v = url.searchParams.get('v');
    if (v) return v;
    const match = url.pathname.match(/\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/);
    return match?.[1] ?? null;
  }

  return null;
}

function vimeoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\.|^player\./, '');
  if (host !== 'vimeo.com') return null;
  const match = url.pathname.match(/\/(?:video\/)?(\d+)/);
  return match?.[1] ?? null;
}

/** Analyse un lien vidéo. Renvoie `null` si ce n'est ni YouTube ni Vimeo. */
export function parseVideoUrl(raw?: string | null): VideoInfo | null {
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  const yt = youtubeId(url);
  if (yt && YOUTUBE_ID.test(yt)) {
    return {
      provider: 'youtube',
      id: yt,
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
      thumbnailUrl: `https://i.ytimg.com/vi/${yt}/maxresdefault.jpg`,
      thumbnailFallbackUrl: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
    };
  }

  const vm = vimeoId(url);
  if (vm) {
    return {
      provider: 'vimeo',
      id: vm,
      embedUrl: `https://player.vimeo.com/video/${vm}?autoplay=1`,
      thumbnailUrl: null,
      thumbnailFallbackUrl: null,
    };
  }

  return null;
}

/**
 * Récupère la miniature d'une vidéo Vimeo via oEmbed (côté serveur).
 * Mise en cache 24 h, abandon après 3 s : ne bloque jamais le rendu de la page.
 */
export async function resolveVimeoThumbnail(videoUrl: string): Promise<string | null> {
  try {
    const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}&width=768`;
    const res = await fetch(endpoint, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail_url?: string };
    return data.thumbnail_url ?? null;
  } catch {
    return null;
  }
}
