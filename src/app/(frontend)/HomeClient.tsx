'use client';

import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLiveGlobal, useLiveList } from '@/hooks/useLiveDocument';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { FadeIn } from '@/components/FadeIn';
import { NewsletterForm } from '@/components/NewsletterForm';
import { ExpandableText } from '@/components/ExpandableText';
import { ConcertDates, ConcertPosters } from '@/components/ConcertPosters';
import { ConcertFeature } from '@/components/ConcertFeature';
import { stockImages, placeholderForMusician, directorPlaceholder } from '@/lib/unsplash';
import { toConcertCard, type ConcertCard, type ConcertDoc } from '@/lib/concerts';
import { renderEmphasis } from '@/lib/emphasis';
import { resolveHomeSections, type HomeSectionKey } from '@/lib/homeSections';

interface HomeClientProps {
  initialData: any;
  concerts: ConcertCard[];
  partners: any[];
  director: any | null;
  musiciansSample: any[];
}

/**
 * Adresse d'un partenaire telle qu'elle part en lien sortant. Le champ est
 * rempli à la main dans l'admin : « exemple.fr » ou « www.exemple.fr » sont
 * complétés en https, sans quoi le navigateur les prendrait pour une page du
 * site. Une adresse qui porte déjà son protocole est laissée telle quelle.
 */
const partnerUrl = (value: unknown): string => {
  const url = typeof value === 'string' ? value.trim() : '';
  if (!url) return '';
  return /^(https?:\/\/|mailto:|tel:)/i.test(url) ? url : `https://${url.replace(/^\/+/, '')}`;
};

/** Concert modifié dans l'admin → carte affichée ; brouillon ou concert passé → retiré. */
const liveConcertCard = (doc: Record<string, any>): ConcertCard | null =>
  doc?.status === 'draft' ? null : toConcertCard(doc as ConcertDoc);

export function HomeClient({
  initialData,
  concerts: initialConcerts,
  partners: initialPartners,
  director,
  musiciansSample,
}: HomeClientProps) {
  // Aperçu en direct : la page d'accueil, et les concerts ou partenaires
  // modifiés dans l'admin (chacun ne touche que sa propre fiche).
  const data = useLiveGlobal('home-page', initialData, 2);
  const concerts = useLiveList<ConcertCard>('concerts', initialConcerts, {
    transform: liveConcertCard,
    depth: 2,
  });
  const partners = useLiveList('partners', initialPartners);

  useLivePreviewSync(data);

  const hero = data.hero;
  const presentation = data.presentation;
  const newsletter = data.newsletter;

  // `concerts` only contains upcoming concerts (see lib/concerts.ts), soonest first.
  const hasConcerts = concerts.length > 0;
  // Concert à la une (section Concerts) : celui coché « À la une sur l'accueil »
  // dans l'admin (le plus proche si plusieurs), sinon le prochain concert.
  const spotlight: ConcertCard | undefined = concerts.find((c) => c.featured) ?? concerts[0];
  const otherConcerts = spotlight ? concerts.filter((c) => c.id !== spotlight.id) : concerts;

  const directorSlug = director?.slug || director?.id;

  const featuredCfg = data?.featured || {};
  const directorLabel: string = featuredCfg.directorLabel || 'Le chef';
  const directorLinkLabel: string = featuredCfg.directorLinkLabel || 'Sa vision';
  const soloistsTitle: string = featuredCfg.soloistsTitle || 'Solistes invités';
  const soloistsIntro: string = featuredCfg.soloistsIntro || '';
  const featuredSoloists: Array<{ soloist: any; contextOverride?: string }> =
    Array.isArray(featuredCfg.soloists) ? featuredCfg.soloists : [];
  const directorTaglineFallback: string =
    featuredCfg.directorTaglineFallback ||
    'Violoniste de formation, directeur artistique de l\'orchestre depuis sa fondation en 2017.';
  const soloistsEyebrow: string = featuredCfg.soloistsEyebrow || 'Avec nous';
  const soloistLinkLabel: string = featuredCfg.soloistLinkLabel || 'Son univers';

  // Every section title/label below is editable in Pages → Page d'accueil;
  // the strings here are only the defaults shown until the field is filled.
  // Ligne de repères du bas de bannière : seulement ce qui est saisi dans l'admin.
  // Pas de texte par défaut : l'ancien (« 40 à 80 musiciens », « Direction Loïc
  // Emmelin ») répétait la description et la légende de la photo juste au-dessus.
  const credits: string[] = Array.isArray(hero?.credits)
    ? hero.credits.map((c: any) => c?.text).filter(Boolean)
    : [];

  const statement = data?.statement || {};
  const statementLines: string[] = (
    statement.lines ||
    'Une *chambre* de musiciens\nqui jouent le répertoire *symphonique*\nsans rien perdre : ni la précision,\nni la chaleur, ni l\'*émotion*\ndu premier accord.'
  )
    .split('\n')
    .map((l: string) => l.trim())
    .filter(Boolean);

  const concertsCfg = data?.concerts || {};
  const nextLabel: string = concertsCfg.nextLabel || 'Prochain concert';
  const todayLabel: string = concertsCfg.todayLabel || 'Aujourd\'hui';
  const cancelledLabel: string = concertsCfg.cancelledLabel || 'Annulé';
  const bookingLabel: string = concertsCfg.bookingLabel || 'Réserver une place';
  const bookingLabelShort: string = concertsCfg.bookingLabelShort || 'Réserver';
  // Affichage choisi dans l'admin (Section Concerts → Affichage) : mur
  // d'affiches (défaut), bande défilante ou liste éditoriale.
  const concertsLayout: 'posters' | 'strip' | 'list' =
    concertsCfg.layout === 'list' || concertsCfg.layout === 'strip' ? concertsCfg.layout : 'posters';

  const bento = data?.bento || {};
  const partnersCfg = data?.partners || {};

  // Ordre et visibilité des sections sous la bannière : réglés dans l'admin
  // (Pages → Page d'accueil → « Sections de la page »), voir lib/homeSections.ts.
  const visibleSections = resolveHomeSections(data?.sections).filter((section) => !section.hidden);
  const showNewsletter = visibleSections.some((section) => section.key === 'newsletter');
  // Bouton principal du bandeau : pointe par défaut sur la section Concerts ;
  // si elle est masquée, l'ancre n'existe plus et le bouton ne mènerait nulle part.
  const showConcerts = visibleSections.some((section) => section.key === 'concerts');
  const ctaPrimaryLink: string = hero?.ctaPrimaryLink || '#concerts';
  const ctaPrimaryDead = !showConcerts && /^\/?#concerts$/.test(ctaPrimaryLink.trim());

  const sections: Record<HomeSectionKey, () => ReactNode> = {
    statement: () => (
      <>
        {/* STATEMENT — manifesto with atmospheric counterpoint */}
        <section className="home-statement" data-live-field="statement">
          <div className={`home-statement__inner${statement.hideImage ? ' home-statement__inner--text' : ''}`}>
            {/* « Sans photo » coché dans l'admin : le manifeste seul, sur toute la largeur. */}
            {!statement.hideImage && (
              <figure className="home-statement__media">
                <Image
                  src={statement.image?.url || stockImages.violin}
                  alt={statement.image?.alt || ''}
                  fill
                  sizes="(max-width: 900px) 100vw, 38vw"
                  style={{ objectFit: 'cover' }}
                />
                <div className="home-statement__media-halo" aria-hidden />
              </figure>
            )}

            <div className="home-statement__text">
              <p className="eyebrow eyebrow--on-dark">{statement.eyebrow || 'Notre conviction'}</p>
              <p className="home-statement__line">
                {statementLines.map((line, i) => (
                  <span key={i} className="home-statement__line-part">
                    {i > 0 && <br />}
                    {renderEmphasis(line.replace(/ :/g, '\u202f:'))}
                  </span>
                ))}
              </p>
              <hr className="velvet-rule long" />
              {(statement.ctaText || statement.ctaLink) !== '' && (
                <Link href={statement.ctaLink || '/a-propos'} className="link-arrow link-arrow--on-dark">
                  {statement.ctaText || 'Notre histoire'} →
                </Link>
              )}
            </div>
          </div>
        </section>
      </>
    ),
    concerts: () => (
      <>
        {/* CONCERTS — affichage choisi dans l'admin : affiches, bande ou liste */}
        {/* data-live-field : depuis l'éditeur de la page d'accueil, un clic sélectionne la section
            (affichage, titres, libellés) ; data-live-link : ailleurs, il ouvre les concerts. */}
        <section
          className="home-concerts"
          id="concerts"
          data-live-field="concerts"
          data-live-link="/admin/collections/concerts"
        >
          <header className="home-concerts__head">
            <p className="eyebrow">{concertsCfg.eyebrow || 'La saison'}</p>
            <h2 className="home-concerts__title">
              {renderEmphasis(concertsCfg.title || '*Prochains* concerts')}
            </h2>
            <hr className="velvet-rule" />
          </header>

          {hasConcerts ? (
            <FadeIn>
            {spotlight && (
              <ConcertFeature
                concert={spotlight}
                labels={{
                  featured: 'À la une',
                  booking: bookingLabelShort,
                  bookingSoon: 'Billetterie à venir',
                  cancelled: cancelledLabel,
                  tickets: 'Dates et billetterie',
                  program: 'Programme',
                }}
              />
            )}
            {otherConcerts.length > 0 && (
            <div className="home-concerts__more">
            <h3 className="home-concerts__more-title">Aussi à l’affiche</h3>
            {concertsLayout !== 'list' ? (
              <ConcertPosters
                concerts={otherConcerts}
                noLead
                variant={concertsLayout}
                labels={{
                  next: nextLabel,
                  today: todayLabel,
                  cancelled: cancelledLabel,
                  booking: bookingLabel,
                  bookingShort: bookingLabelShort,
                }}
              />
            ) : (
            <ol className="concerts-list">
              {otherConcerts.map((concert, index) => {
                const isLead = false;
                const cancelled = concert.status === 'cancelled';
                const multiple = concert.performances.length > 1;
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
                              {cancelled ? cancelledLabel : concert.date.isToday ? todayLabel : nextLabel}
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
                          <h3 className="concert-row__title" data-live-item-field="title">
                            {concert.url ? (
                              <Link href={concert.url} className="concert-title-link">
                                {concert.title}
                              </Link>
                            ) : (
                              concert.title
                            )}
                          </h3>
                          {multiple ? (
                            <ConcertDates
                              performances={concert.performances}
                              cancelled={cancelled}
                              bookingLabel={bookingLabelShort}
                              className="concert-row__dates"
                            />
                          ) : (
                            <p className="concert-row__venue">{concert.venue}</p>
                          )}
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
                            <span className="concert-badge concert-badge--cancelled">{cancelledLabel}</span>
                          ) : multiple ? null : concert.bookingLink ? (
                            <a
                              href={concert.bookingLink}
                              className={isLead ? 'btn-filled' : 'link-arrow'}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {isLead ? bookingLabel : bookingLabelShort} →
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </li>
                );
              })}
            </ol>
            )}
            </div>
            )}
            </FadeIn>
          ) : (
            <div className="home-concerts__empty">
              <p>{concertsCfg.emptyTitle || 'La prochaine saison se prépare.'}</p>
              <p>
                {concertsCfg.emptyText ||
                  'Les dates seront annoncées ici dès qu\u2019elles seront fixées. Inscrivez-vous à la lettre d\u2019information pour être prévenu·e en avant-première.'}
              </p>
              {showNewsletter && (
                <a href="#newsletter" className="link-arrow">
                  {concertsCfg.emptyCtaText || 'Recevoir les prochaines dates'} →
                </a>
              )}
            </div>
          )}
        </section>
      </>
    ),
    bento: () => (
      <>
        {/* BENTO — meet the orchestra */}
        <section className="home-bento" data-live-field="bento">
          <header className="home-bento__head">
            <p className="eyebrow eyebrow--accent">{bento.eyebrow || 'Rencontre'}</p>
            <h2 className="home-bento__title">
              {renderEmphasis(bento.title || '*Les visages* de l\'orchestre')}
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
                <p className="bento-card__lede">{director?.tagline || directorTaglineFallback}</p>
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
                <p className="eyebrow eyebrow--accent">{bento.musiciansEyebrow || 'L\'ensemble'}</p>
                <h3 className="bento-card__title">
                  {renderEmphasis(bento.musiciansTitle || '*Les musiciens*')}
                </h3>
                <p className="bento-card__lede">
                  {bento.musiciansText ||
                    'Issus de conservatoires français, suisses et belges. Étudiants, amateurs éclairés, jeunes professionnels.'}
                </p>
                <span className="link-arrow">{bento.musiciansLinkLabel || 'Découvrir'} →</span>
              </div>
            </Link>

            {/* History — small card */}
            <Link href={bento.historyLink || '/a-propos'} className="bento-card bento-card--history">
              <p className="eyebrow eyebrow--accent">{bento.historyEyebrow || 'Depuis'}</p>
              <span className="bento-card__year">{bento.historyYear || '2017'}</span>
              <p className="bento-card__history-text">
                {bento.historyText ||
                  'Fondé à Mâcon, l\'orchestre rassemble plus de 80 musiciens autour de la passion du répertoire symphonique.'}
              </p>
              <span className="link-arrow">{bento.historyLinkLabel || 'L\'histoire'} →</span>
            </Link>
          </div>
        </section>
      </>
    ),
    soloists: () => (
      <>
        {/* SOLOISTES — guest spotlight, editorial row */}
        {featuredSoloists.length > 0 && (
          <section
            className="home-soloists"
            data-live-field="featured.soloists"
          >
            <header className="home-soloists__head">
              <p className="eyebrow eyebrow--accent">{soloistsEyebrow}</p>
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
                          {soloistLinkLabel} →
                        </a>
                      )}
                    </div>
                  </FadeIn>
                );
              })}
            </ul>
          </section>
        )}
      </>
    ),
    presentation: () => (
      <>
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
      </>
    ),
    partners: () => (
      <>
        {/* PARTNERS */}
        {partners.length > 0 && (
          <section className="home-partners" data-live-field="partners" data-live-link="/admin/collections/partners">
            <p className="eyebrow eyebrow--centered">{partnersCfg.eyebrow || 'Avec le soutien de'}</p>
            <ul className="home-partners__list">
              {partners.map((partner: any, i: number) => {
                const href = partnerUrl(partner.url);
                const logo = partner.logo?.url ? partner.logo : null;
                // Le logo remplace le nom quand il y en a un ; sinon, le nom seul.
                const mark = logo ? (
                  // Pas de next/image ici : les logos sont souvent des SVG, que
                  // l'optimiseur d'images refuse tant qu'il ne les autorise pas.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="home-partners__logo"
                    src={logo.url}
                    alt={logo.alt || partner.name}
                    loading="lazy"
                    data-live-item-field="logo"
                  />
                ) : (
                  <span data-live-item-field="name">{partner.name}</span>
                );

                return (
                  <li
                    key={partner.id || i}
                    data-live-link={partner.id ? `/admin/collections/partners/${partner.id}` : undefined}
                  >
                    {href ? (
                      // Lien sortant. On garde le référent (pas de « noreferrer »)
                      // pour que le partenaire voie les visites venues de l'orchestre.
                      <a
                        className="home-partners__link"
                        href={href}
                        target="_blank"
                        rel="noopener"
                        title={`${partner.name} — ouvrir le site`}
                      >
                        {mark}
                      </a>
                    ) : (
                      mark
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </>
    ),
    newsletter: () => (
      <>
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
              <NewsletterForm
                placeholder={newsletter?.placeholder}
                buttonLabel={newsletter?.buttonLabel}
                successLabel={newsletter?.successLabel}
              />
            </div>
          </section>
        </div>
      </>
    ),
  };

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
              {!ctaPrimaryDead && (
                <a href={ctaPrimaryLink} className="link-arrow link-arrow--on-dark">
                  {hero?.ctaPrimaryText || 'Voir la saison'} →
                </a>
              )}
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

          {credits.length > 0 && (
            <div className="hero-modern__credit">
              {credits.map((text, i) => (
                <span key={i} className="hero-modern__credit-item">
                  {i > 0 && (
                    <span className="dot" aria-hidden>
                      ·
                    </span>
                  )}
                  <span>{text}</span>
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      {visibleSections.map((section) => (
        <Fragment key={section.key}>{sections[section.key]()}</Fragment>
      ))}
    </>
  );
}
