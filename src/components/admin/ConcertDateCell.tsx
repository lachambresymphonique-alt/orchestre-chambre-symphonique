import './admin-theme.css';
import './admin-concerts.css';
import {
  describeConcertDate,
  performancesOf,
  todayKey,
  type ConcertDateView,
  type ConcertPerformanceDoc,
} from '@/lib/concerts';

type Props = {
  cellData?: unknown;
  rowData?: Record<string, any>;
};

const capitalize = (s: string) => (s ? s.charAt(0).toLocaleUpperCase('fr-FR') + s.slice(1) : s);

/** « sam. 18 avril » */
const short = (v: ConcertDateView) => `${v.weekday.slice(0, 3)}. ${v.day} ${v.month}`;

/**
 * « Représentations » column of the Concerts list: the date (or the range of
 * dates), the venues, and a badge telling at a glance whether the concert is
 * upcoming, today, past, a draft or cancelled. A concert stays « upcoming »
 * until its last performance.
 */
export function ConcertDateCell({ cellData, rowData }: Props) {
  const rows = (Array.isArray(cellData) ? cellData : []) as ConcertPerformanceDoc[];
  const views = performancesOf({
    performances: rows,
    date: rowData?.date,
    time: rowData?.time,
    venue: rowData?.venue,
    bookingLink: rowData?.bookingLink,
  })
    .map((p) => ({ venue: p.venue?.trim() || '', view: describeConcertDate(p.date ?? null, p.time) }))
    .filter((x): x is { venue: string; view: ConcertDateView } => x.view !== null);

  if (views.length === 0) {
    return <span className="lcs-datecell lcs-datecell--empty">Date manquante</span>;
  }

  const today = todayKey();
  const first = views[0].view;
  const last = views[views.length - 1].view;
  const next = (views.find((x) => x.view.key >= today) ?? views[views.length - 1]).view;
  const multiple = views.length > 1;

  const venues: string[] = [];
  for (const { venue } of views) if (venue && !venues.includes(venue)) venues.push(venue);

  const status = rowData?.status;
  const tone =
    status === 'draft'
      ? 'draft'
      : status === 'cancelled'
        ? 'cancelled'
        : next.isToday
          ? 'today'
          : last.isPast
            ? 'past'
            : 'upcoming';

  const label: Record<typeof tone, string> = {
    draft: 'Brouillon',
    cancelled: 'Annulé',
    today: 'Aujourd\'hui',
    past: 'Passé',
    upcoming: 'À venir',
  };

  const range = multiple
    ? `${capitalize(short(first))}${first.year !== last.year ? ` ${first.year}` : ''} → ${short(last)} ${last.year}`
    : `${capitalize(next.long)}${next.time ? ` · ${next.time}` : ''}`;

  return (
    <span className="lcs-datecell">
      <time dateTime={next.iso} className="lcs-datecell__date">
        {range}
      </time>
      <span className="lcs-datecell__meta">
        {multiple ? `${views.length} représentations` : ''}
        {multiple && venues.length ? ' · ' : ''}
        {venues.join(' · ')}
      </span>
      <span className={`lcs-badge lcs-badge--${tone}`}>{label[tone]}</span>
    </span>
  );
}

export default ConcertDateCell;
