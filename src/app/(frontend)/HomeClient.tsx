'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLivePreview } from '@payloadcms/live-preview-react';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { FadeIn } from '@/components/FadeIn';
import { NewsletterForm } from '@/components/NewsletterForm';
import { stockImages, placeholderForMusician, directorPlaceholder } from '@/lib/unsplash';

interface HomeClientProps {
  initialData: any;
  concerts: any[];
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

  const featured = concerts[0];
  const restConcerts = concerts.slice(1);

  // Build a marquee string from the upcoming concerts' programme
  const programmeStrip = concerts
    .map((c: any) => c.program?.split('\n')[0] || c.title)
    .filter(Boolean)
    .slice(0, 8)
    .join('   ·   ');

  const directorSlug = director?.slug || director?.id;

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
              <p className="eyebrow eyebrow--accent">Prochain concert</p>
              <p className="hero-modern__next-date">
                <span className="hero-modern__next-day">{featured.day}</span>
                <span className="hero-modern__next-month">{featured.monthYear}</span>
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

      {/* MARQUEE */}
      {programmeStrip && (
        <section
          className="programme-marquee"
          aria-label="Au programme cette saison"
          data-live-link="/admin/collections/concerts"
        >
          <div className="programme-marquee__track">
            <span>{programmeStrip}   ·   {programmeStrip}   ·   </span>
          </div>
        </section>
      )}

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

      {/* FEATURED CONCERT spread */}
      {featured && (
        <section
          className="home-featured"
          id="concerts"
          data-live-link={featured.id ? `/admin/collections/concerts/${featured.id}` : '/admin/collections/concerts'}
        >
          <div className="home-featured__media">
            <Image
              src={featured.image?.url || stockImages.concertHall}
              alt={featured.image?.alt || featured.title}
              fill
              sizes="(max-width: 900px) 100vw, 55vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="home-featured__text">
            <p className="eyebrow eyebrow--accent">À l'affiche</p>
            <div className="home-featured__date">
              <span className="home-featured__day">{featured.day}</span>
              <span className="home-featured__month">{featured.monthYear}</span>
            </div>
            <h2 className="home-featured__title">{featured.title}</h2>
            <p className="home-featured__venue">{featured.venue}</p>
            {featured.program && (
              <p className="home-featured__program">{featured.program}</p>
            )}
            <div className="home-featured__cta">
              {featured.bookingLink ? (
                <a
                  href={featured.bookingLink}
                  className="btn-filled"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Réserver une place →
                </a>
              ) : (
                <span className="concert-row__pending">Sur invitation</span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* OTHER CONCERTS list */}
      {restConcerts.length > 0 && (
        <section className="home-concerts">
          <header className="home-concerts__head">
            <p className="eyebrow">La saison</p>
            <h2 className="home-concerts__title">
              <em>Autres</em> dates
            </h2>
            <hr className="velvet-rule" />
          </header>

          <ol className="concerts-list">
            {restConcerts.map((concert: any, index: number) => (
              <FadeIn key={concert.id || index}>
                <li
                  className="concert-row"
                  data-live-link={concert.id ? `/admin/collections/concerts/${concert.id}` : undefined}
                >
                  <div className="concert-row__date">
                    <span className="concert-row__day">{concert.day}</span>
                    <span className="concert-row__month">{concert.monthYear}</span>
                  </div>
                  <div className="concert-row__body">
                    <h3 className="concert-row__title">{concert.title}</h3>
                    <p className="concert-row__venue">{concert.venue}</p>
                    {concert.program && (
                      <p className="concert-row__program">{concert.program}</p>
                    )}
                  </div>
                  <div className="concert-row__action">
                    {concert.bookingLink ? (
                      <a href={concert.bookingLink} className="link-arrow" target="_blank" rel="noopener noreferrer">
                        Réserver →
                      </a>
                    ) : (
                      <span className="concert-row__pending">Sur invitation</span>
                    )}
                  </div>
                </li>
              </FadeIn>
            ))}
          </ol>
        </section>
      )}

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
              <p className="eyebrow eyebrow--on-dark eyebrow--accent">Le chef</p>
              <h3 className="bento-card__title">
                <em>{director?.name || 'Loïc Emmelin'}</em>
              </h3>
              <p className="bento-card__lede">
                {director?.tagline ||
                  'Violoniste de formation, directeur artistique de l\'orchestre depuis sa fondation en 2017.'}
              </p>
              <span className="link-arrow link-arrow--on-dark">Sa vision →</span>
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
        <section className="home-newsletter">
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
