'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLivePreview } from '@payloadcms/live-preview-react';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { FadeIn } from '@/components/FadeIn';
import { NewsletterForm } from '@/components/NewsletterForm';
import { ExpandableText } from '@/components/ExpandableText';
import { stockImages, placeholderForMusician, directorPlaceholder } from '@/lib/unsplash';
import type { ConcertCard } from '@/lib/concerts';

interface HomeClientProps {
  initialData: any;
  concerts: ConcertCard[];
  partners: any[];
  director: any | null;
  musiciansSample: any[];
}

export function HomeClient({
  initialData,
  concerts,
  partners,
  director,
  musiciansSample,
}: HomeClientProps) {
  const serverURL = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL || '');

  const { data } = useLivePreview({
    initialData,
    serverURL,
    depth: 1,
  });

  useLivePreviewSync(data);

  const hero = data.hero;
  const presentation = data.presentation;
  const newsletter = data.newsletter;

  // `concerts` only contains upcoming concerts (see lib/concerts.ts), soonest
  // first: the first one is the next date, summarised in the hero.
  const featured: ConcertCard | undefined = concerts[0];
  const hasConcerts = concerts.length > 0;

  const directorSlug = director?.slug || director?.id;

  const featuredCfg = data?.featured || {};
  const directorLabel: string = featuredCfg.directorLabel || 'Le chef';
  const directorLinkLabel: string = featuredCfg.directorLinkLabel || 'Sa vision';
  const soloistsTitle: string = featuredCfg.soloistsTitle || 'Solistes invités';
  const soloistsIntro: string = featuredCfg.soloistsIntro || '';
  const featuredSoloists: Array<{ soloist: any; contextOverride?: string }> =
    Array.isArray(featuredCfg.soloists) ? featuredCfg.soloists : [];

  return (
    <>
      {/* HERO — type cathedral with portrait */}
      <div data-live-field="hero">
        <section className="hero-modern">
          <div className="hero-modern__bg" aria-hidden>
            <div className="hero-modern__halo" />
          </div>

          <div className="hero-modern__content">
            <p className="eyebrow eyebrow--accent eyebrow--on-dark">
              {hero?.subtitle || 'Orchestre · Bourgogne · Rhône-Alpes'}
            </p>
            <h1 className="hero-modern__title">
              <span className="hero-modern__line-a">{hero?.titleLine1 || 'La Chambre'}</span>
              <em className="hero-modern__line-b">{hero?.titleLine2Italic || 'Symphonique'}</em>
            </h1>

            {hero?.description && (
              <p className="hero-modern__lede">{hero.description}</p>
            )}

            <div className="hero-modern__cues">
              <a href={hero?.ctaPrimaryLink || '#concerts'} className="link-arrow link-arrow--on-dark">
                {hero?.ctaPrimaryText || 'Voir la saison'} →
              </a>
              <Link
                href={hero?.ctaSecondaryLink || '/directeur-artistique'}
                className="link-arrow link-arrow--on-dark link-arrow--mute"
              >
                {hero?.ctaSecondaryText || 'Le directeur artistique'}
              </Link>
            </div>
          </div>

          <div className="hero-modern__portrait">
            <Image
              src={hero?.portraitImage?.url || director?.photo?.url || directorPlaceholder}
              alt={hero?.portraitImage?.alt || director?.name || 'Loïc Emmelin, directeur artistique'}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 38vw"
              style={{ objectFit: 'cover' }}
            />
            <div className="hero-modern__portrait-caption">
              <span className="velvet-mark on-dark" aria-hidden />
              <span>
                {hero?.portraitCaption ||
                  `${director?.name || 'Loïc Emmelin'}, direction`}
              </span>
            </div>
          </div>

          {featured && (
            <div className="hero-modern__next-concert">
              <p className="eyebrow eyebrow--accent">
                {featured.status === 'cancelled'
                  ? 'Concert annulé'
                  : featured.date.isToday
                    ? 'Aujourd\'hui'
                    : 'Prochain concert'}
              </p>
              <p className="hero-modern__next-date">
                <time dateTime={featured.date.iso} className="hero-modern__next-day">
                  {featured.date.day}
                </time>
                <span className="hero-modern__next-month">
                  {featured.date.monthYear}
                  {featured.date.time && <> · {featured.date.time}</>}
                </span>
              </p>
              <p className="hero-modern__next-title">{featured.title}</p>
              <p className="hero-modern__next-venue">{featured.venue}</p>
            </div>
          )}

          <div className="hero-modern__credit">
            <span>Fondé en 2017</span>
            <span className="dot" aria-hidden>·</span>
            <span>40 à 80 musiciens</span>
            <span className="dot" aria-hidden>·</span>
            <span>Direction Loïc Emmelin</span>
          </div>
        </section>
      </div>

      {/* STATEMENT — manifesto with atmospheric counterpoint */}
      <section className="home-statement">
        <div className="home-statement__inner">
          <figure className="home-statement__media">
            <Image
              src={stockImages.violin}
              alt=""
              fill
              sizes="(max-width: 900px) 100vw, 38vw"
              style={{ objectFit: 'cover' }}
            />
            <div className="home-statement__media-halo" aria-hidden />
          </figure>

          <div className="home-statement__text">
            <p className="eyebrow eyebrow--on-dark">Notre conviction</p>
            <p className="home-statement__line">
              Une <em>chambre</em> de musiciens
              <br />
              qui jouent le répertoire <em>symphonique</em>
              <br />
              sans rien perdre&#8239;: ni la précision,
              <br />
              ni la chaleur, ni l'<em>émotion</em>
              <br />
              du premier accord.
            </p>
            <hr className="velvet-rule long" />
            <Link href="/a-propos" className="link-arrow link-arrow--on-dark">
              Notre histoire →
            </Link>
          </div>
        </div>
      </section>

      {/* CONCERTS — one simple list; the next concert leads with its photo */}
      <section className="home-concerts" id="concerts" data-live-link="/admin/collections/concerts">
        <header className="home-concerts__head">
          <p className="eyebrow">La saison</p>
          <h2 className="home-concerts__title">
            <em>Prochains</em> concerts
          </h2>
          <hr className="velvet-rule" />
        </header>

        {hasConcerts ? (
          <FadeIn>
          <ol className="concerts-list">
            {concerts.map((concert, index) => {
              const isLead = index === 0;
              const cancelled = concert.status === 'cancelled';
              const rowClass = [
                'concert-row',
                isLead ? 'concert-row--lead' : '',
                cancelled ? 'is-cancelled' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                  <li
                    key={concert.id || index}
                    className={rowClass}
                    data-live-link={concert.id ? `/admin/collections/concerts/${concert.id}` : undefined}
                  >
                    {isLead && (
                      <div
                        className="concert-row__media"
                        // Posters are portrait, photos landscape: keep the image's own ratio so nothing is cropped.
                        style={
                          concert.image?.width && concert.image?.height
                            ? ({ ['--ratio' as string]: `${concert.image.width} / ${concert.image.height}` } as React.CSSProperties)
                            : undefined
                        }
                      >
                        <Image
                          src={concert.image?.url || stockImages.concertHall}
                          alt={concert.image?.alt || concert.title}
                          fill
                          sizes="(max-width: 900px) 100vw, 45vw"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div className="concert-row__details">
                      <div className="concert-row__date">
                        {isLead && (
                          <span className="concert-row__tag">
                            {cancelled ? 'Annulé' : concert.date.isToday ? 'Aujourd\'hui' : 'Prochain concert'}
                          </span>
                        )}
                        <time dateTime={concert.date.iso} className="concert-row__day">
                          {concert.date.day}
                        </time>
                        <span className="concert-row__month">{concert.date.monthYear}</span>
                        <span className="concert-row__when">
                          {concert.date.weekday}
                          {concert.date.time && <> · {concert.date.time}</>}
                        </span>
                      </div>
                      <div className="concert-row__body">
                        <h3 className="concert-row__title">{concert.title}</h3>
                        <p className="concert-row__venue">{concert.venue}</p>
                        {concert.program && (
                          <ExpandableText
                            text={concert.program}
                            lines={isLead ? 7 : 4}
                            className="concert-row__program"
                          />
                        )}
                      </div>
                      <div className="concert-row__action">
                        {cancelled ? (
                          <span className="concert-badge concert-badge--cancelled">
                            {isLead ? 'Concert annulé' : 'Annulé'}
                          </span>
                        ) : concert.bookingLink ? (
                          <a
                            href={concert.bookingLink}
                            className={isLead ? 'btn-filled' : 'link-arrow'}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {isLead ? 'Réserver une place' : 'Réserver'} →
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </li>
              );
            })}
          </ol>
          </FadeIn>
        ) : (
          <div className="home-concerts__empty">
            <p>La prochaine saison se prépare.</p>
            <p>
              Les dates seront annoncées ici dès qu&rsquo;elles seront fixées. Inscrivez-vous à la
              lettre d&rsquo;information pour être prévenu·e en avant-première.
            </p>
            <a href="#newsletter" className="link-arrow">
              Recevoir les prochaines dates →
            </a>
          </div>
        )}
      </section>

      {/* BENTO — meet the orchestra */}
      <section className="home-bento">
        <header className="home-bento__head">
          <p className="eyebrow eyebrow--accent">Rencontre</p>
          <h2 className="home-bento__title">
            <em>Les visages</em> de l'orchestre
          </h2>
        </header>

        <div className="bento-grid">
          {/* Loïc — large card */}
          <Link
            href={directorSlug ? '/directeur-artistique' : '/musiciens'}
            className="bento-card bento-card--director"
            data-live-link={director?.id ? `/admin/collections/musicians/${director.id}` : '/admin/collections/musicians'}
          >
            <div className="bento-card__media">
              <Image
                src={director?.photo?.url || directorPlaceholder}
                alt={director?.name || 'Loïc Emmelin'}
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="bento-card__text">
              <p className="eyebrow eyebrow--on-dark eyebrow--accent">{directorLabel}</p>
              <h3 className="bento-card__title">
                <em>{director?.name || 'Loïc Emmelin'}</em>
              </h3>
              <p className="bento-card__lede">
                {director?.tagline ||
                  'Violoniste de formation, directeur artistique de l\'orchestre depuis sa fondation en 2017.'}
              </p>
              <span className="link-arrow link-arrow--on-dark">{directorLinkLabel} →</span>
            </div>
          </Link>

          {/* Musicians sample — collage */}
          <Link
            href="/musiciens"
            className="bento-card bento-card--musicians"
            data-live-link="/admin/collections/musicians"
          >
            <div className="bento-card__collage">
              {musiciansSample.slice(0, 4).map((m: any) => (
                <div key={m.id || m.name} className="bento-card__collage-item">
                  <Image
                    src={m.photo?.url || placeholderForMusician(m.name)}
                    alt={m.name}
                    fill
                    sizes="(max-width: 900px) 50vw, 25vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
            <div className="bento-card__text">
              <p className="eyebrow eyebrow--accent">L'ensemble</p>
              <h3 className="bento-card__title">
                <em>Les musiciens</em>
              </h3>
              <p className="bento-card__lede">
                Issus de conservatoires français, suisses et belges. Étudiants, amateurs éclairés,
                jeunes professionnels.
              </p>
              <span className="link-arrow">Découvrir →</span>
            </div>
          </Link>

          {/* History — small card */}
          <Link href="/a-propos" className="bento-card bento-card--history">
            <p className="eyebrow eyebrow--accent">Depuis</p>
            <span className="bento-card__year">2017</span>
            <p className="bento-card__history-text">
              Fondé à Mâcon, l'orchestre rassemble plus de 80 musiciens autour de la passion
              du répertoire symphonique.
            </p>
            <span className="link-arrow">L'histoire →</span>
          </Link>
        </div>
      </section>

      {/* SOLOISTES — guest spotlight, editorial row */}
      {featuredSoloists.length > 0 && (
        <section
          className="home-soloists"
          data-live-field="featured.soloists"
        >
          <header className="home-soloists__head">
            <p className="eyebrow eyebrow--accent">Avec nous</p>
            <h2 className="home-soloists__title">
              <em>{soloistsTitle}</em>
            </h2>
            <hr className="velvet-rule long" />
            {soloistsIntro && (
              <p className="home-soloists__intro">{soloistsIntro}</p>
            )}
          </header>

          <ul className="home-soloists__list" role="list">
            {featuredSoloists.map((entry, i) => {
              const s = entry?.soloist;
              if (!s || typeof s !== 'object') return null;
              const ctx = entry?.contextOverride?.trim() || s?.context || '';
              const photoUrl = s?.photo?.url;
              return (
                <FadeIn key={s.id || i} className="home-soloist">
                  <div className="home-soloist__portrait">
                    {photoUrl ? (
                      <Image
                        src={photoUrl}
                        alt={s.photo?.alt || s.name}
                        fill
                        sizes="(max-width: 700px) 80vw, 360px"
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                      />
                    ) : (
                      <div className="home-soloist__portrait-fallback" aria-hidden>
                        <span>{(s.name || '?').charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="home-soloist__text">
                    <p className="home-soloist__instrument">{s.instrument}</p>
                    <h3 className="home-soloist__name">
                      <em>{s.name}</em>
                    </h3>
                    {ctx && <p className="home-soloist__context">{ctx}</p>}
                    {s.tagline && (
                      <p className="home-soloist__tagline">{s.tagline}</p>
                    )}
                    {s.website && (
                      <a
                        href={s.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-arrow link-arrow--mute"
                      >
                        Son univers →
                      </a>
                    )}
                  </div>
                </FadeIn>
              );
            })}
          </ul>
        </section>
      )}

      {/* PRESENTATION — long-form (kept) */}
      <div data-live-field="presentation">
        <section className="home-presentation">
          <div className="home-presentation__inner">
            <FadeIn className="home-presentation__media">
              <Image
                src={presentation?.image?.url || stockImages.orchestraWide}
                alt={presentation?.image?.alt || "L'orchestre en concert"}
                width={900}
                height={1100}
                sizes="(max-width: 900px) 100vw, 50vw"
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              />
            </FadeIn>

            <FadeIn className="home-presentation__text">
              <p className="eyebrow eyebrow--accent">{presentation?.subtitle || "L'orchestre"}</p>
              <h2 className="home-presentation__title">
                <em>{presentation?.title || 'La musique en partage'}</em>
              </h2>
              <hr className="velvet-rule" />
              <div className="home-presentation__prose">
                {(presentation?.paragraphs || '')
                  .split('\n\n')
                  .filter(Boolean)
                  .map((p: string, i: number) => (
                    <p key={i} data-lead={i === 0 ? 'true' : undefined}>{p}</p>
                  ))}
              </div>
              <div className="home-presentation__foot">
                <Link href={presentation?.ctaLink || '/a-propos'} className="link-arrow">
                  {presentation?.ctaText || 'Lire la suite'} →
                </Link>
                {presentation?.signature && (
                  <p className="home-presentation__signature">— {presentation.signature}</p>
                )}
              </div>
            </FadeIn>
          </div>
        </section>
      </div>

      {/* PARTNERS */}
      {partners.length > 0 && (
        <section className="home-partners" data-live-link="/admin/collections/partners">
          <p className="eyebrow eyebrow--centered">Avec le soutien de</p>
          <ul className="home-partners__list">
            {partners.map((partner: any, i: number) => (
              <li
                key={partner.id || i}
                data-live-link={partner.id ? `/admin/collections/partners/${partner.id}` : undefined}
              >
                <span>{partner.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* NEWSLETTER */}
      <div data-live-field="newsletter">
        <section className="home-newsletter" id="newsletter">
          <div className="home-newsletter__halo" aria-hidden />
          <div className="home-newsletter__inner">
            <p className="eyebrow eyebrow--accent eyebrow--on-dark">{newsletter?.subtitle || 'Restez en contact'}</p>
            <h2 className="home-newsletter__title">
              <em>{newsletter?.title || 'La saison à votre porte'}</em>
            </h2>
            {newsletter?.description && (
              <p className="home-newsletter__lede">{newsletter.description}</p>
            )}
            <NewsletterForm />
          </div>
        </section>
      </div>
    </>
  );
}
