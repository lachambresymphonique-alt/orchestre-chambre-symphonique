'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ExpandableText } from '@/components/ExpandableText';
import type { ConcertCard } from '@/lib/concerts';

export type ConcertPostersVariant = 'posters' | 'strip';

export type ConcertPostersLabels = {
  /** « Prochain concert » — étiquette posée sur la première affiche. */
  next: string;
  /** « Aujourd'hui » — remplace la précédente le jour même. */
  today: string;
  /** « Annulé » */
  cancelled: string;
  /** « Réserver une place » — bouton du prochain concert. */
  booking: string;
  /** « Réserver » — lien des autres dates. */
  bookingShort: string;
};

type Props = {
  concerts: ConcertCard[];
  variant: ConcertPostersVariant;
  labels: ConcertPostersLabels;
};

/**
 * Affichage « Affiches » des prochains concerts (page d'accueil).
 *
 * Chaque concert est une affiche : son visuel au format 3:4 — jamais recadré,
 * l'image est posée entière sur un fond flouté d'elle-même —, la date en onglet,
 * puis titre, lieu, programme et réservation. Sans visuel, la date elle-même
 * devient l'affiche. Quand une billetterie existe, toute l'affiche est cliquable.
 *
 * Deux mises en page pour la même carte, choisies dans l'admin
 * (Pages → Page d'accueil → Section Concerts → Affichage) :
 *  - `posters` : mur d'affiches, 1 à 3 colonnes selon l'écran ;
 *  - `strip`   : bande horizontale qui défile, une affiche à la fois.
 */
export function ConcertPosters({ concerts, variant, labels }: Props) {
  if (variant === 'strip') {
    return <ConcertStrip concerts={concerts} labels={labels} />;
  }
  return (
    <ol className="concerts-posters">
      {concerts.map((concert, index) => (
        <ConcertPoster
          key={concert.id || index}
          concert={concert}
          isLead={index === 0}
          labels={labels}
        />
      ))}
    </ol>
  );
}

function ConcertStrip({ concerts, labels }: Omit<Props, 'variant'>) {
  const trackRef = useRef<HTMLOListElement>(null);
  const [overflows, setOverflows] = useState(false);

  // Les flèches n'apparaissent que si la bande déborde vraiment.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollWidth > el.clientWidth + 4);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [concerts.length]);

  const scrollByOne = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('.concert-poster');
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = card ? card.getBoundingClientRect().width + gap : el.clientWidth * 0.8;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * step, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <div className="concerts-strip">
      <div className={`concerts-strip__nav${overflows ? '' : ' is-hidden'}`}>
        <button
          type="button"
          className="concerts-strip__btn"
          onClick={() => scrollByOne(-1)}
          aria-label="Concerts précédents"
          tabIndex={overflows ? 0 : -1}
        >
          <Arrow direction="left" />
        </button>
        <button
          type="button"
          className="concerts-strip__btn"
          onClick={() => scrollByOne(1)}
          aria-label="Concerts suivants"
          tabIndex={overflows ? 0 : -1}
        >
          <Arrow direction="right" />
        </button>
      </div>
      <ol ref={trackRef} className="concerts-strip__track">
        {concerts.map((concert, index) => (
          <ConcertPoster
            key={concert.id || index}
            concert={concert}
            isLead={index === 0}
            labels={labels}
          />
        ))}
      </ol>
    </div>
  );
}

function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === 'left' ? (
        <>
          <path d="M19 12H5" />
          <path d="M11 6l-6 6 6 6" />
        </>
      ) : (
        <>
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </>
      )}
    </svg>
  );
}

function ConcertPoster({
  concert,
  isLead,
  labels,
}: {
  concert: ConcertCard;
  isLead: boolean;
  labels: ConcertPostersLabels;
}) {
  const cancelled = concert.status === 'cancelled';
  const linked = !cancelled && !!concert.bookingLink;
  const tag = cancelled
    ? labels.cancelled
    : isLead
      ? concert.date.isToday
        ? labels.today
        : labels.next
      : null;
  const className = ['concert-poster', linked ? 'is-linked' : '', cancelled ? 'is-cancelled' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <li
      className={className}
      data-live-link={concert.id ? `/admin/collections/concerts/${concert.id}` : undefined}
    >
      <div className="concert-poster__media">
        {concert.image ? (
          <>
            {/* Fond : la même image floutée, pour que l'affiche tienne entière dans le cadre sans recadrage. */}
            <Image
              src={concert.image.url}
              alt=""
              aria-hidden="true"
              fill
              sizes="160px"
              className="concert-poster__backdrop"
              style={{ objectFit: 'cover' }}
            />
            <Image
              src={concert.image.url}
              alt={concert.image.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
              className="concert-poster__img"
              style={{ objectFit: 'contain' }}
            />
            <span className="concert-poster__stub" aria-hidden="true">
              <span className="concert-poster__stub-day">{concert.date.day}</span>
              <span className="concert-poster__stub-month">{concert.date.month}</span>
            </span>
          </>
        ) : (
          <div className="concert-poster__blank" aria-hidden="true">
            <span className="concert-poster__blank-day">{concert.date.day}</span>
            <span className="concert-poster__blank-rule" />
            <span className="concert-poster__blank-month">
              {concert.date.month} {concert.date.year}
            </span>
          </div>
        )}
        {tag && (
          <span className={`concert-poster__tag${cancelled ? ' concert-poster__tag--cancelled' : ''}`}>
            {tag}
          </span>
        )}
      </div>

      <div className="concert-poster__body">
        <p className="concert-poster__when">
          <time dateTime={concert.date.iso}>{concert.date.long}</time>
          {concert.date.time && <> · {concert.date.time}</>}
        </p>
        <h3 className="concert-poster__title" data-live-item-field="title">{concert.title}</h3>
        {concert.venue && <p className="concert-poster__venue">{concert.venue}</p>}
        {concert.program && (
          <ExpandableText text={concert.program} lines={3} className="concert-poster__program" />
        )}
        {linked && (
          <div className="concert-poster__action">
            <a
              href={concert.bookingLink as string}
              className={`concert-poster__cta ${isLead ? 'btn-filled' : 'link-arrow'}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {isLead ? labels.booking : labels.bookingShort} →
            </a>
          </div>
        )}
      </div>
    </li>
  );
}
