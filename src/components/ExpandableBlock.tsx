'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Bloc de texte (paragraphes, texte riche) replié sur téléphone, avec
 * « Lire la suite » : la hauteur repliée est fixée en CSS
 * (.expandable-block__body.is-clamped, globals.css), sous 700 px seulement.
 * Le bouton n'apparaît que si le texte dépasse vraiment : jamais sur
 * ordinateur, où rien n'est replié.
 */
export function ExpandableBlock({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    // Mesure au montage puis à chaque changement de largeur (rotation, fenêtre).
    const observer = new ResizeObserver(() => setOverflows(el.scrollHeight > el.clientHeight + 2));
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded]);

  return (
    <div className="expandable-block">
      <div ref={ref} className={`${className} expandable-block__body${expanded ? '' : ' is-clamped'}`}>
        {children}
      </div>
      {(overflows || expanded) && (
        <button
          type="button"
          className="expandable__toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? 'Réduire' : 'Lire la suite'}
        </button>
      )}
    </div>
  );
}
