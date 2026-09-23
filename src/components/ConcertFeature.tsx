import Image from 'next/image';
import type { ConcertCard } from '@/lib/concerts';
import { ExpandableText } from './ExpandableText';
import { describeDateRange } from './ConcertPosters';

/**
 * Concert à la une de l'accueil : l'affiche en grand à gauche ; à droite le
 * titre, chaque représentation avec sa date, son lieu et son lien de
 * billetterie, puis le programme.
 *
 * Le concert à la une se choisit dans l'admin (Concerts → une fiche → case
 * « À la une sur l'accueil ») ; à défaut, c'est le prochain concert.
 */

export type ConcertFeatureLabels = {
  featured: string;
  booking: string;
  bookingSoon: string;
  cancelled: string;
  tickets: string;
  program: string;
};

export function ConcertFeature({ concert, labels }: { concert: ConcertCard; labels: ConcertFeatureLabels }) {
  const cancelled = concert.status === 'cancelled';
  const dates = concert.performances.length > 0 ? concert.performances : [];
  const multiple = dates.length > 1;

  return (
    <article
      className={`concert-feature${cancelled ? ' is-cancelled' : ''}`}
      data-live-link={concert.id ? `/admin/collections/concerts/${concert.id}` : undefined}
    >
      <figure className="concert-feature__poster" data-live-item-field="image">
        {concert.image ? (
          <>
            <Image
              src={concert.image.url}
              alt=""
              aria-hidden="true"
              fill
              sizes="200px"
              className="concert-feature__backdrop"
              style={{ objectFit: 'cover' }}
            />
            <Image
              src={concert.image.url}
              alt={concert.image.alt}
              fill
              sizes="(max-width: 900px) 100vw, 45vw"
              className="concert-feature__img"
              style={{ objectFit: 'contain' }}
            />
          </>
        ) : (
          <div className="concert-feature__blank" aria-hidden="true">
            <span className="concert-feature__blank-day">{concert.date.day}</span>
            <span className="concert-feature__blank-month">
              {concert.date.month} {concert.date.year}
            </span>
          </div>
        )}
      </figure>

      <div className="concert-feature__body">
        <p className="concert-feature__eyebrow">
          <span>{cancelled ? labels.cancelled : labels.featured}</span>
          <span aria-hidden="true">·</span>
          <span>
            {multiple ? `${dates.length} dates · ${describeDateRange(dates)}` : concert.date.long}
          </span>
        </p>
        <h3 className="concert-feature__title" data-live-item-field="title">
          {concert.title}
        </h3>

        {dates.length > 0 && (
          <section className="concert-feature__block" aria-label={labels.tickets} data-live-item-field="performances">
            <h4 className="concert-feature__label">{labels.tickets}</h4>
            <ol className="concert-feature__dates">
              {dates.map((p) => (
                <li key={p.id} className="concert-feature__date">
                  <time className="concert-feature__stack" dateTime={p.date.iso}>
                    <span className="concert-feature__day">{p.date.day}</span>
                    <span className="concert-feature__month">{p.date.month}</span>
                  </time>
                  <div className="concert-feature__where">
                    <span className="concert-feature__weekday">
                      {p.date.weekday}
                      {p.date.time ? ` · ${p.date.time}` : ''}
                    </span>
                    <span className="concert-feature__venue">{p.venue}</span>
                  </div>
                  <div className="concert-feature__action">
                    {cancelled ? (
                      <span className="concert-feature__soon">{labels.cancelled}</span>
                    ) : p.bookingLink ? (
                      <a
                        href={p.bookingLink}
                        className="concert-feature__book"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${labels.booking} — ${p.date.long}, ${p.venue}`}
                      >
                        {labels.booking} <span aria-hidden="true">→</span>
                      </a>
                    ) : (
                      <span className="concert-feature__soon">{labels.bookingSoon}</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {concert.program && (
          <section className="concert-feature__block" data-live-item-field="program">
            <h4 className="concert-feature__label">{labels.program}</h4>
            <ExpandableText text={concert.program} lines={7} className="concert-feature__program" />
          </section>
        )}
      </div>
    </article>
  );
}
