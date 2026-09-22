'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  text: string;
  /** Number of lines shown before the « Lire la suite » toggle. */
  lines?: number;
  className?: string;
};

/**
 * Paragraph clamped to a few lines, with a toggle only when the text really
 * overflows. Line breaks in the source text are preserved.
 */
export function ExpandableText({ text, lines = 4, className = '' }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (expanded) return;
      setOverflows(el.scrollHeight > el.clientHeight + 2);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [expanded, text, lines]);

  return (
    <div className="expandable">
      <p
        ref={ref}
        className={`${className} expandable__text${expanded ? '' : ' is-clamped'}`}
        style={expanded ? undefined : ({ ['--lines' as string]: lines } as React.CSSProperties)}
      >
        {text}
      </p>
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
