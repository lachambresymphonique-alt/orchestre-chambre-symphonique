'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { placeholderForMusician } from '@/lib/unsplash';
import { objectPositionOf } from '@/lib/focalPoint';

export type StripMusician = {
  id?: string | number;
  name: string;
  slug?: string | null;
  role?: string | null;
  instrument?: string | null;
  photo?: { url?: string | null; alt?: string | null; focalX?: number | null; focalY?: number | null } | null;
};

/**
 * Bande de portraits des musiciens (accueil, carte « Les musiciens ») : elle
 * défile au doigt ; chaque portrait mène à la page du musicien, la dernière
 * vignette à la page Musiciens. Sur ordinateur, deux flèches font défiler
 * d'un portrait, seulement si la bande déborde.
 */
export function MusiciansStrip({ musicians, allLabel }: { musicians: StripMusician[]; allLabel: string }) {
  const trackRef = useRef<HTMLOListElement>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setOverflows(el.scrollWidth > el.clientWidth + 4));
    observer.observe(el);
    return () => observer.disconnect();
  }, [musicians.length]);

  const scrollByOne = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const item = el.querySelector<HTMLElement>('li');
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = item ? item.getBoundingClientRect().width + gap : el.clientWidth * 0.8;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * step, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <div className="musicians-strip">
      <ol ref={trackRef} className="musicians-strip__track" aria-label="Quelques musiciens de l'orchestre">
        {musicians.map((m) => {
          const handle = m.slug || m.id;
          const detail = m.instrument || m.role;
          return (
            <li key={m.id || m.name} data-live-link={m.id ? `/admin/collections/musicians/${m.id}` : undefined}>
              <Link href={handle ? `/musiciens/${handle}` : '/musiciens'} className="musicians-strip__item">
                <span className="musicians-strip__photo">
                  <Image
                    src={m.photo?.url || placeholderForMusician(m.name)}
                    alt=""
                    fill
                    sizes="(max-width: 900px) 42vw, 11rem"
                    // Visages dans le tiers haut du portrait, sauf point focal
                    // choisi dans la bibliothèque d'images.
                    style={{ objectFit: 'cover', objectPosition: objectPositionOf(m.photo, '50% 28%') }}
                  />
                </span>
                <span className="musicians-strip__name">{m.name}</span>
                {detail && <span className="musicians-strip__role">{detail}</span>}
              </Link>
            </li>
          );
        })}
        <li>
          <Link href="/musiciens" className="musicians-strip__all">
            <span className="musicians-strip__all-label">{allLabel}</span>
            <span className="musicians-strip__all-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        </li>
      </ol>

      <div className={`musicians-strip__nav${overflows ? '' : ' is-hidden'}`}>
        <button type="button" className="musicians-strip__btn" onClick={() => scrollByOne(-1)} aria-label="Musiciens précédents">
          <span aria-hidden="true">←</span>
        </button>
        <button type="button" className="musicians-strip__btn" onClick={() => scrollByOne(1)} aria-label="Musiciens suivants">
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
