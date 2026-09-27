'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

type Photo = {
  id?: string;
  image: { url?: string | null; alt?: string | null; width?: number | null; height?: number | null };
  caption: string;
};

/**
 * Photos d'une section : mosaïque (la première en grand) ou grille régulière.
 * Un clic agrandit la photo dans une fenêtre (flèches pour passer à la
 * suivante, Échap pour fermer). Pas de carrousel.
 */
export function PhotoGrid({ photos, variant }: { photos: Photo[]; variant: 'mosaic' | 'grid' }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  const show = useCallback((i: number) => {
    setOpen(i);
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);
  const close = useCallback(() => dialog.current?.close(), []);
  const step = useCallback(
    (delta: number) => setOpen((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    const onClose = () => setOpen(null);
    el.addEventListener('keydown', onKey);
    el.addEventListener('close', onClose);
    return () => {
      el.removeEventListener('keydown', onKey);
      el.removeEventListener('close', onClose);
    };
  }, [step]);

  const current = open === null ? null : photos[open];

  return (
    <>
      <ul className={`lcs-photos lcs-photos--${variant}`} data-count={photos.length}>
        {photos.map((p, i) => (
          <li key={p.id ?? i} className="lcs-photos__item">
            <button type="button" className="lcs-photos__open" onClick={() => show(i)} aria-label={`Agrandir : ${p.image.alt || p.caption || `photo ${i + 1}`}`}>
              <span className="lcs-photo">
                <Image
                  src={p.image.url!}
                  alt={p.image.alt ?? ''}
                  fill
                  sizes={variant === 'mosaic' && i === 0 ? '(max-width: 800px) 100vw, 66vw' : '(max-width: 800px) 50vw, 33vw'}
                  style={{ objectFit: 'cover' }}
                />
              </span>
            </button>
            {p.caption && <p className="lcs-photos__caption">{p.caption}</p>}
          </li>
        ))}
      </ul>

      <dialog ref={dialog} className="lcs-lightbox" onClick={(e) => e.target === dialog.current && close()}>
        {current && (
          <figure className="lcs-lightbox__figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.image.url!} alt={current.image.alt ?? ''} />
            {current.caption && <figcaption>{current.caption}</figcaption>}
          </figure>
        )}
        <div className="lcs-lightbox__bar">
          {photos.length > 1 && (
            <>
              <button type="button" onClick={() => step(-1)} aria-label="Photo précédente">←</button>
              <span aria-live="polite">
                {open !== null ? open + 1 : 0} / {photos.length}
              </span>
              <button type="button" onClick={() => step(1)} aria-label="Photo suivante">→</button>
            </>
          )}
          <button type="button" onClick={close} aria-label="Fermer" className="lcs-lightbox__close">✕</button>
        </div>
      </dialog>
    </>
  );
}
