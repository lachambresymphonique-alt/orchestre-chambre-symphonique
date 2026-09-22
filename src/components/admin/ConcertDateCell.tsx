import './admin-theme.css';
import { describeConcertDate } from '@/lib/concerts';

type Props = {
  cellData?: unknown;
  rowData?: Record<string, any>;
};

const capitalize = (s: string) => (s ? s.charAt(0).toLocaleUpperCase('fr-FR') + s.slice(1) : s);

/**
 * « Date » column of the Concerts list: full French date, time, and a badge
 * telling at a glance whether the concert is upcoming, today, past, a draft
 * or cancelled.
 */
export function ConcertDateCell({ cellData, rowData }: Props) {
  const view = describeConcertDate(
    typeof cellData === 'string' || cellData instanceof Date ? cellData : null,
    rowData?.time,
  );

  if (!view) {
    return <span className="lcs-datecell lcs-datecell--empty">Date manquante</span>;
  }

  const status = rowData?.status;
  const tone =
    status === 'draft'
      ? 'draft'
      : status === 'cancelled'
        ? 'cancelled'
        : view.isToday
          ? 'today'
          : view.isPast
            ? 'past'
            : 'upcoming';

  const label: Record<typeof tone, string> = {
    draft: 'Brouillon',
    cancelled: 'Annulé',
    today: 'Aujourd\'hui',
    past: 'Passé',
    upcoming: 'À venir',
  };

  return (
    <span className="lcs-datecell">
      <time dateTime={view.iso} className="lcs-datecell__date">
        {capitalize(view.long)}
        {view.time ? ` · ${view.time}` : ''}
      </time>
      <span className={`lcs-badge lcs-badge--${tone}`}>{label[tone]}</span>
    </span>
  );
}

export default ConcertDateCell;
