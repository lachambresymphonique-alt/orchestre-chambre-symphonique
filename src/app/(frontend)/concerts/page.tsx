import '@/components/concert-page.css';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getPayloadClient } from '@/lib/payload';
import { findPastConcerts, findUpcomingConcerts, type ConcertCard } from '@/lib/concerts';
import { citiesOf, periodOf, SITE_NAME } from '@/lib/concertSeo';
import { RefreshOnSave } from '@/components/RefreshOnSave';

const DESCRIPTION =
  'Les prochains concerts de La Chambre Symphonique en Bourgogne et Rhône-Alpes : dates, lieux, programmes et billetterie. Et les archives des saisons passées.';

export const metadata: Metadata = {
  title: `Concerts — ${SITE_NAME}`,
  description: DESCRIPTION,
  alternates: { canonical: '/concerts' },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: SITE_NAME,
    url: '/concerts',
    title: `Concerts — ${SITE_NAME}`,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `Concerts — ${SITE_NAME}`,
    description: DESCRIPTION,
  },
};

/** Lien vers la page du concert ; simple bloc tant que la fiche n'a pas d'adresse. */
function ConcertLink({ url, className, children }: { url: string | null; className: string; children: React.ReactNode }) {
  return url ? (
    <Link href={url} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

const capitalize = (s: string) => (s ? s.charAt(0).toLocaleUpperCase('fr-FR') + s.slice(1) : s);

/** « 3 représentations · 31 octobre – 7 novembre 2026 » ou « Samedi 18 avril 2026 · 18h00 ». */
function when(c: ConcertCard, list = c.performances.length ? c.performances : c.allPerformances): string {
  if (list.length > 1) return `${list.length} représentations · ${periodOf(list)}`;
  const d = list[0]?.date ?? c.date;
  return `${capitalize(d.long)}${d.time ? ` · ${d.time}` : ''}`;
}

/**
 * Tous les concerts : la saison à venir (affiches), puis les archives par
 * année. Chaque concert mène à sa page (/concerts/<slug>).
 */
export default async function ConcertsPage() {
  const payload = await getPayloadClient();
  const [upcoming, past] = await Promise.all([
    findUpcomingConcerts(payload as any, { limit: 60 }).catch(() => [] as ConcertCard[]),
    findPastConcerts(payload as any).catch(() => [] as ConcertCard[]),
  ]);

  const byYear = new Map<string, ConcertCard[]>();
  for (const c of past) {
    const year = c.allPerformances[c.allPerformances.length - 1]?.date.year || c.date.year;
    byYear.set(year, [...(byYear.get(year) ?? []), c]);
  }

  return (
    <>
      <RefreshOnSave />
      <div className="concerts-index">
        <header className="page-header">
          <div className="container">
            <p className="breadcrumb">
              <Link href="/">Accueil</Link> / Concerts
            </p>
            <h1>Concerts</h1>
            <p>La saison de l’orchestre : dates, lieux, programmes et billetterie. Les concerts passés restent en archive.</p>
          </div>
        </header>

        <section className="concerts-index__season" aria-labelledby="concerts-upcoming">
          <h2 id="concerts-upcoming" className="concert-page__h2">
            À l’affiche
          </h2>
          {upcoming.length === 0 ? (
            <p className="concerts-index__empty">La prochaine saison se prépare : les dates arrivent bientôt.</p>
          ) : (
            <ul className="concerts-index__grid">
              {upcoming.map((c) => (
                <li key={c.id} className={`concerts-index__card${c.status === 'cancelled' ? ' is-cancelled' : ''}`}>
                  <ConcertLink url={c.url} className="concerts-index__link">
                    <span className="concerts-index__poster">
                      {c.image ? (
                        // Image décorative dans un lien déjà nommé par le titre.
                        <Image
                          src={c.image.url}
                          alt=""
                          fill
                          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <span className="concerts-index__poster-blank" aria-hidden="true">
                          {c.date.day} {c.date.month}
                        </span>
                      )}
                    </span>
                    <span className="concerts-index__when">
                      {c.status === 'cancelled' ? 'Annulé · ' : ''}
                      {when(c)}
                    </span>
                    <span className="concerts-index__title">{c.title}</span>
                    <span className="concerts-index__where">{citiesOf(c.performances).join(' · ')}</span>
                    {c.url && <span className="concerts-index__more link-arrow">Voir le concert →</span>}
                  </ConcertLink>
                </li>
              ))}
            </ul>
          )}
        </section>

        {byYear.size > 0 && (
          <section className="concerts-index__archive" aria-labelledby="concerts-archive">
            <h2 id="concerts-archive" className="concert-page__h2">
              Les saisons passées
            </h2>
            {[...byYear.entries()].map(([year, list]) => (
              <div key={year} className="concerts-index__year">
                <h3 className="concerts-index__year-title">{year}</h3>
                <ol className="concerts-index__rows">
                  {list.map((c) => (
                    <li key={c.id} className={c.status === 'cancelled' ? 'is-cancelled' : undefined}>
                      <ConcertLink url={c.url} className="concerts-index__row">
                        <span className="concerts-index__row-when">
                          {c.status === 'cancelled' ? 'Annulé · ' : ''}
                          {when(c, c.allPerformances)}
                        </span>
                        <span className="concerts-index__row-title">{c.title}</span>
                        <span className="concerts-index__row-where">{citiesOf(c.allPerformances).join(' · ')}</span>
                      </ConcertLink>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </section>
        )}
      </div>
    </>
  );
}
