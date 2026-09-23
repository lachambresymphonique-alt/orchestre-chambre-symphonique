'use client';

import '@/components/concert-page.css';
import Image from 'next/image';
import Link from 'next/link';
import { useLiveDoc } from '@/hooks/useLiveDocument';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { toConcertCard, type ConcertCard, type ConcertDoc } from '@/lib/concerts';
import { bookable, citiesOf, periodOf } from '@/lib/concertSeo';

const capitalize = (s: string) => (s ? s.charAt(0).toLocaleUpperCase('fr-FR') + s.slice(1) : s);

/** Ligne d'en-tête : état, nombre de dates et période. */
function summary(card: ConcertCard): string {
  const all = card.allPerformances;
  const period = periodOf(all);
  if (card.status === 'cancelled') return `Concert annulé · ${period}`;
  if (card.performances.length === 0) return `Concert passé · ${period}`;
  if (all.length > 1) return `${all.length} représentations · ${period}`;
  const d = all[0].date;
  return `${capitalize(d.long)}${d.time ? ` · ${d.time}` : ''}`;
}

/**
 * Page d'un concert (/concerts/<slug>) : affiche, dates et billetterie de
 * chaque représentation, programme, solistes et présentation. Aperçu en direct
 * depuis l'admin (Contenu → Concerts) : chaque bloc renvoie à son champ.
 */
export function ConcertDetail({
  doc,
  initial,
  others,
}: {
  doc: ConcertDoc;
  initial: ConcertCard;
  others: ConcertCard[];
}) {
  const live = useLiveDoc<ConcertDoc & { id: string | number }>('concerts', doc as ConcertDoc & { id: string | number }, 2);
  useLivePreviewSync(live);
  // Rendu serveur tel quel ; recalcul seulement quand l'aperçu envoie une version.
  const card = live === doc ? initial : toConcertCard(live) ?? initial;

  const cancelled = card.status === 'cancelled';
  const cities = citiesOf(card.allPerformances);
  const program = card.program
    .split(/\n+/)
    .map((l) => l.trim().replace(/[,;]\s*$/, ''))
    .filter(Boolean);
  const paragraphs = card.description
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const years = new Set(card.allPerformances.map((p) => p.date.year));

  return (
    <div className={`concert-page${cancelled ? ' is-cancelled' : ''}`}>
      <header className="page-header concert-page__header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> / <Link href="/concerts">Concerts</Link>
          </p>
          <p className="concert-page__summary" data-live-field="performances">
            {summary(card)}
          </p>
          <h1 className="concert-page__title" data-live-field="title">
            {card.title}
          </h1>
          {cities.length > 0 && <p className="concert-page__cities">{cities.join(' · ')}</p>}
        </div>
      </header>

      <section className="concert-page__body">
        <div className="concert-page__grid">
          <figure className="concert-page__poster" data-live-field="image">
            {card.image ? (
              <>
                <Image
                  src={card.image.url}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="200px"
                  className="concert-page__poster-backdrop"
                  style={{ objectFit: 'cover' }}
                />
                <Image
                  src={card.image.url}
                  alt={card.image.alt}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 40vw"
                  className="concert-page__poster-img"
                  style={{ objectFit: 'contain' }}
                />
              </>
            ) : (
              <div className="concert-page__poster-blank" aria-hidden="true">
                <span>{card.date.day}</span>
                <span>
                  {card.date.month} {card.date.year}
                </span>
              </div>
            )}
          </figure>

          <div className="concert-page__main">
            {cancelled && (
              <p className="concert-page__notice concert-page__notice--cancelled">
                Ce concert est annulé.
              </p>
            )}

            <section className="concert-page__section" aria-labelledby="concert-dates">
              <h2 id="concert-dates" className="concert-page__h2">
                {card.allPerformances.length > 1 ? 'Dates et billetterie' : 'Date et billetterie'}
              </h2>
              <ol className="concert-page__dates" data-live-field="performances">
                {card.allPerformances.map((p) => {
                  const past = p.date.isPast;
                  return (
                    <li key={p.id} className={`concert-page__date${past ? ' is-past' : ''}`}>
                      <time dateTime={p.date.iso} className="concert-page__date-when">
                        <span className="concert-page__date-day">{p.date.day}</span>
                        <span className="concert-page__date-month">
                          {p.date.month}
                          {years.size > 1 ? ` ${p.date.year}` : ''}
                        </span>
                      </time>
                      <div className="concert-page__date-body">
                        <p className="concert-page__date-line">
                          {capitalize(p.date.weekday)}
                          {p.date.time ? ` · ${p.date.time}` : ''}
                        </p>
                        {p.place && <p className="concert-page__date-place">{p.place}</p>}
                      </div>
                      <div className="concert-page__date-action">
                        {cancelled ? (
                          <span className="concert-badge concert-badge--cancelled">Annulé</span>
                        ) : past ? (
                          <span className="concert-page__date-state">Passé</span>
                        ) : bookable(p.bookingLink) ? (
                          <a
                            href={p.bookingLink as string}
                            className="btn-filled concert-page__book"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Réserver →
                          </a>
                        ) : (
                          <span className="concert-page__date-state">Billetterie à venir</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            {program.length > 0 && (
              <section className="concert-page__section" aria-labelledby="concert-program">
                <h2 id="concert-program" className="concert-page__h2">
                  Programme
                </h2>
                <ul className="concert-page__program" data-live-field="program">
                  {program.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </section>
            )}

            {card.soloists.length > 0 && (
              <section className="concert-page__section" aria-labelledby="concert-soloists">
                <h2 id="concert-soloists" className="concert-page__h2">
                  {card.soloists.length > 1 ? 'Avec les solistes' : 'Avec'}
                </h2>
                <ul className="concert-page__soloists" data-live-field="soloists">
                  {card.soloists.map((s) => (
                    <li key={s.id}>
                      <Link href={s.href} className="concert-page__soloist">
                        <span className="concert-page__soloist-photo" aria-hidden="true">
                          {s.photo ? (
                            <Image src={s.photo.url} alt="" fill sizes="64px" style={{ objectFit: 'cover' }} />
                          ) : (
                            <span>{s.name.charAt(0)}</span>
                          )}
                        </span>
                        <span className="concert-page__soloist-text">
                          <span className="concert-page__soloist-name">{s.name}</span>
                          {s.instrument && <span className="concert-page__soloist-role">{s.instrument}</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {paragraphs.length > 0 && (
              <section className="concert-page__section" aria-labelledby="concert-about">
                <h2 id="concert-about" className="concert-page__h2">
                  Présentation
                </h2>
                <div className="concert-page__prose" data-live-field="description">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>

      <section className="concert-page__others" aria-labelledby="concert-others">
        <div className="concert-page__others-inner">
          <h2 id="concert-others" className="concert-page__h2">
            {others.length > 0 ? 'Les autres concerts' : 'La saison'}
          </h2>
          {others.length > 0 && (
            <ul className="concert-page__others-list">
              {others.map((c) => (
                <li key={c.id}>
                  <Link href={c.url || '/concerts'} className="concert-page__other" prefetch={false}>
                    <span className="concert-page__other-when">
                      {c.performances.length > 1 ? `${c.performances.length} dates · ${periodOf(c.performances)}` : c.date.long}
                    </span>
                    <span className="concert-page__other-title">{c.title}</span>
                    <span className="concert-page__other-where">{citiesOf(c.performances).join(' · ')}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/concerts" className="link-arrow">
            Tous les concerts →
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ConcertDetail;
