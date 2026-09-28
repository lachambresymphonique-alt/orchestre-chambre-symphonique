'use client';

import { useEffect, useState } from 'react';

/** Icônes au trait fin (1.25 px, DESIGN.md), à la couleur du texte. */
const stroke = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const ShareIcon = () => (
  <svg {...stroke}>
    <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
);

export const CalendarIcon = () => (
  <svg {...stroke}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4M12 13.5v4M10 15.5h4" />
  </svg>
);

export const PinIcon = () => (
  <svg {...stroke}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.25" />
  </svg>
);

/**
 * « Partager » : la feuille de partage du téléphone (WhatsApp, SMS…) quand
 * elle existe, sinon le lien copié dans le presse-papiers.
 */
export function ShareButton({ title, url, className = '' }: { title: string; url: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2400);
    return () => clearTimeout(timer);
  }, [copied]);

  const share = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
      } catch {
        // Partage annulé : rien à faire.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Presse-papiers refusé : le lien reste dans la barre d'adresse.
    }
  };

  return (
    <button type="button" className={`concert-share ${className}`.trim()} onClick={share}>
      <ShareIcon />
      <span aria-live="polite">{copied ? 'Lien copié' : 'Partager'}</span>
    </button>
  );
}

export type BookingBarDate = {
  id: string;
  /** « Sam. 31 oct. · Grenoble » */
  label: string;
  /** Ville (ou salle) seule, pour la liste de plusieurs dates. */
  city: string;
  href: string;
};

/**
 * Barre « Réserver » fixée en bas de l'écran du téléphone (voir
 * concert-page.css) : la billetterie reste à portée de pouce pendant qu'on
 * lit l'affiche et le programme. Elle s'efface quand la liste des dates est à
 * l'écran (elle ferait doublon) et au pied de page.
 */
export function BookingBar({ dates, datesId }: { dates: BookingBarDate[]; datesId: string }) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const watched = [
      document.getElementById(datesId)?.closest('section'),
      document.querySelector('footer.footer'),
    ].filter((el): el is Element => !!el);
    const onScreen = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      setHidden(onScreen.size > 0);
    });
    watched.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [datesId]);

  if (dates.length === 0) return null;
  const single = dates.length === 1 ? dates[0] : null;

  return (
    <aside className={`booking-bar${hidden ? ' is-hidden' : ''}`} aria-label="Billetterie" inert={hidden}>
      <p className="booking-bar__text">
        <span className="booking-bar__eyebrow">{single ? 'Billetterie ouverte' : `${dates.length} dates en vente`}</span>
        <span className="booking-bar__when">{single ? single.label : dates.map((d) => d.city).join(' · ')}</span>
      </p>
      {single ? (
        <a href={single.href} className="btn-filled booking-bar__cta" target="_blank" rel="noopener noreferrer">
          Réserver <span aria-hidden="true">→</span>
        </a>
      ) : (
        <a href={`#${datesId}`} className="btn-filled booking-bar__cta">
          Choisir une date
        </a>
      )}
    </aside>
  );
}
