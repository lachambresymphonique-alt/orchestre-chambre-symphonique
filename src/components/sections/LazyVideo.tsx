'use client';

import { useState } from 'react';

/**
 * Vidéo YouTube ou Vimeo chargée seulement au clic : en attendant, une image
 * d'aperçu et un bouton lecture (aucun cookie ni script tiers avant le clic).
 */
export function LazyVideo({
  embedUrl,
  poster,
  posterFallback,
  title,
}: {
  embedUrl: string;
  poster?: string | null;
  posterFallback?: string | null;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [src, setSrc] = useState(poster || posterFallback || null);

  if (playing) {
    return (
      <div className="lcs-video__frame">
        <iframe
          src={embedUrl}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button type="button" className="lcs-video__frame lcs-video__poster" onClick={() => setPlaying(true)} aria-label={`Lire la vidéo : ${title}`}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setSrc(src !== posterFallback ? posterFallback || null : null)}
        />
      )}
      <span className="lcs-video__play" aria-hidden>
        <svg viewBox="0 0 24 24" width="28" height="28">
          <path d="M8 5v14l11-7z" fill="currentColor" />
        </svg>
      </span>
    </button>
  );
}
