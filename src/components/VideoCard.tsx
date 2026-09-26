'use client';

import { useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { renderInline } from '@/lib/richText';

type VideoCardProps = {
  title: string;
  description?: string | null;
  date?: string | null;
  /** Lien d'origine (utilisé si la vidéo n'est pas embarquable). */
  href?: string | null;
  /** URL d'embed (YouTube / Vimeo) : la vidéo se lance en place au clic. */
  embedUrl?: string | null;
  /** Miniature affichée avant lecture. */
  poster?: string | null;
  /** Miniature de repli si `poster` n'existe pas (ex. YouTube sans HD). */
  posterFallback?: string | null;
  posterAlt?: string | null;
};

// Recouvre toute la miniature pour que le clic fonctionne partout,
// tout en laissant le bouton play centré (l'élément .play-icon garde ses styles).
const overlay: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  display: 'grid',
  placeItems: 'center',
  background: 'transparent',
  border: 0,
  padding: 0,
  cursor: 'pointer',
  color: 'inherit',
};

function PlayIcon() {
  return (
    <div className="play-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  );
}

export function VideoCard({
  title,
  description,
  date,
  href,
  embedUrl,
  poster,
  posterFallback,
  posterAlt,
}: VideoCardProps) {
  const [playing, setPlaying] = useState(false);
  const [posterSrc, setPosterSrc] = useState<string | null>(poster ?? null);

  // maxresdefault n'existe pas pour toutes les vidéos YouTube → on bascule sur hqdefault.
  const handlePosterError = () => {
    if (posterFallback && posterSrc !== posterFallback) setPosterSrc(posterFallback);
    else setPosterSrc(null);
  };

  return (
    <>
      <div className="media-thumbnail">
        {playing && embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <>
            {posterSrc && (
              <Image
                src={posterSrc}
                alt={posterAlt || title}
                fill
                sizes="(max-width: 700px) 100vw, 600px"
                style={{ objectFit: 'cover' }}
                onError={handlePosterError}
              />
            )}
            {embedUrl ? (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={`Lire la vidéo : ${title}`}
                style={overlay}
              >
                <PlayIcon />
              </button>
            ) : href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Voir la vidéo : ${title}`}
                style={overlay}
              >
                <PlayIcon />
              </a>
            ) : (
              <PlayIcon />
            )}
          </>
        )}
      </div>
      <div className="media-info">
        <h3>{title}</h3>
        <p>{renderInline(description)}</p>
        <p className="media-date">{date}</p>
      </div>
    </>
  );
}
