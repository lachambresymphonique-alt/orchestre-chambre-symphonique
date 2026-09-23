'use client';

import './admin-concerts.css';
import { useRowLabel } from '@payloadcms/ui';
import { describeConcertDate, formatPlace } from '@/lib/concerts';

type Row = { date?: string | null; time?: string | null; venue?: string | null; city?: string | null };

const capitalize = (s: string) => (s ? s.charAt(0).toLocaleUpperCase('fr-FR') + s.slice(1) : s);

/**
 * En-tête de chaque ligne de la liste « Représentations » d'un concert :
 * « Samedi 18 avril 2026 · 20h30 — Basilique Notre-Dame, Beaune », lisible
 * même quand la ligne est repliée.
 */
export function ConcertPerformanceRowLabel() {
  const { data } = useRowLabel<Row>();
  const view = describeConcertDate(data?.date ?? null, data?.time ?? null);
  const venue = formatPlace(data?.venue, data?.city);

  if (!view && !venue) {
    return (
      <span className="lcs-perf-label lcs-perf-label--empty">
        Nouvelle représentation — date et lieu à renseigner
      </span>
    );
  }

  return (
    <span className="lcs-perf-label">
      <strong>
        {view ? `${capitalize(view.long)}${view.time ? ` · ${view.time}` : ''}` : 'Date à renseigner'}
      </strong>
      {venue ? <span className="lcs-perf-label__venue"> — {venue}</span> : null}
    </span>
  );
}

export default ConcertPerformanceRowLabel;
