'use client';

import Link from 'next/link';
import Image from 'next/image';
import { RefreshOnSave } from '@/components/RefreshOnSave';
import { useLiveDoc, useLiveGlobal } from '@/hooks/useLiveDocument';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { directorPlaceholder } from '@/lib/unsplash';
import { toEmbedUrl } from '@/lib/videoEmbed';
import { resolveDirectorPage } from '@/lib/directorDefaults';
import { renderEmphasis } from '@/lib/emphasis';

/**
 * Page Direction, rendue côté client pour l'aperçu en direct : elle suit à la
 * frappe la page globale « Page Direction » et la fiche du chef (collection
 * Musiciens). Les zones issues de la fiche portent `data-live-owner` : cliquées
 * depuis la Page Direction, elles ouvrent la fiche du musicien.
 */

export type Director = {
  id?: string | number;
  name: string;
  role: string;
  instrument?: string;
  photo?: { url?: string; alt?: string; width?: number; height?: number } | null;
  tagline?: string;
  bio?: string;
  quote?: string;
  formation?: { item: string }[];
  concours?: { item: string }[];
  videoUrl?: string;
};

const StaffLine = ({ className = '' }: { className?: string }) => (
  <svg
    className={`director-staff ${className}`}
    aria-hidden
    viewBox="0 0 1440 24"
    preserveAspectRatio="none"
  >
    <line x1="0" y1="3" x2="1440" y2="3" />
    <line x1="0" y1="9" x2="1440" y2="9" />
    <line x1="0" y1="15" x2="1440" y2="15" />
    <line x1="0" y1="21" x2="1440" y2="21" />
  </svg>
);

const QuotationGlyph = () => (
  <svg viewBox="0 0 60 48" aria-hidden className="director-quote__glyph">
    <path
      d="M22 6c-9 0-16 7-16 18 0 9 6 16 14 16 5 0 8-3 8-7 0-3-2-6-6-6-1 0-2 0-3 1 0-7 5-12 12-13l-1-9zm32 0c-9 0-16 7-16 18 0 9 6 16 14 16 5 0 8-3 8-7 0-3-2-6-6-6-1 0-2 0-3 1 0-7 5-12 12-13l-1-9z"
      fill="currentColor"
      opacity="0.85"
    />
  </svg>
);

const FrameOrnament = () => (
  <svg viewBox="0 0 80 80" aria-hidden className="director-frame__ornament">
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M40 8 C44 8 46 12 40 16 C34 12 36 8 40 8 Z" fill="currentColor" />
      <line x1="40" y1="16" x2="40" y2="64" />
      <circle cx="36" cy="64" r="5" fill="currentColor" />
      <path d="M40 16 C56 22 60 32 56 44" />
    </g>
  </svg>
);

export function DirectorClient({
  global: initialGlobal,
  fallbackDirector,
}: {
  global: Record<string, any> | null;
  fallbackDirector: Director | null;
}) {
  // Aperçu en direct : la page Direction (textes, choix du musicien)…
  const global = useLiveGlobal('director-page', initialGlobal, 2);
  const content = resolveDirectorPage(global);
  const chosen = global?.director && typeof global.director === 'object' ? (global.director as Director) : null;
  // …et la fiche du chef elle-même, quand c'est elle qu'on modifie.
  const director = useLiveDoc<Director>('musicians', (chosen ?? fallbackDirector) as Director) as Director | null;
  const { hero, story, path, encore } = content;
  const owner = director?.id ? `/admin/collections/musicians/${director.id}` : undefined;
  useLivePreviewSync(null);

  if (!director) {
    return (
      <div className="director-page director-page--empty">
        <RefreshOnSave />

        <div className="director-empty-stage">
          <div className="director-empty-stage__halo" aria-hidden />
          <StaffLine className="director-staff--top" />

          <div className="director-empty-stage__inner">
            <p className="eyebrow eyebrow--gold eyebrow--centered">
              Direction artistique
            </p>

            <div className="director-empty-frame" aria-hidden>
              <FrameOrnament />
              <span className="director-empty-frame__caption">À paraître</span>
            </div>

            <h1 className="director-empty-stage__title">
              <span>Le portrait</span>
              <em>se prépare</em>
            </h1>

            <p className="director-empty-stage__lede">
              Cette page accueillera bientôt le portrait, la vision et la voix
              du directeur artistique de l'orchestre.
            </p>

            <hr className="velvet-rule long centered on-dark" />

            <p className="director-empty-stage__hint">
              Pour l'éditeur du site&nbsp;: ajoutez un musicien dans la section
              <em> « Direction artistique » </em>
              depuis l'espace d'administration. Cette page se composera
              automatiquement à partir de sa fiche.
            </p>

            <div className="director-empty-stage__links">
              <Link href="/musiciens" className="link-arrow link-arrow--on-dark">
                Découvrir les musiciens →
              </Link>
              <Link
                href="/admin/collections/musicians/create"
                className="link-arrow link-arrow--on-dark link-arrow--mute"
              >
                Ouvrir l'admin
              </Link>
            </div>
          </div>

          <StaffLine className="director-staff--bottom" />
        </div>
      </div>
    );
  }

  const [firstName, ...restName] = director.name.trim().split(/\s+/);
  const lastName = restName.join(' ');

  const bioParagraphs = (director.bio || '')
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  // Fallbacks come from Pages → Page Direction while the fiche is not filled in.
  const paragraphs =
    bioParagraphs.length > 0
      ? bioParagraphs
      : story.bioFallback.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const lede = director.tagline?.trim() || hero.ledeFallback;
  const facts = [{ label: 'Fonction', value: director.role }, ...hero.facts];

  const photo = director.photo?.url ? director.photo : null;
  const photoRatio =
    photo?.width && photo?.height ? `${photo.width} / ${photo.height}` : '3 / 4';

  const formation = director.formation?.filter((f) => f?.item?.trim()) || [];
  const concours = director.concours?.filter((c) => c?.item?.trim()) || [];
  const embedUrl = toEmbedUrl(director.videoUrl);
  const hasPath = formation.length > 0 || concours.length > 0 || !!embedUrl;

  return (
    <div className="director-page">
      <RefreshOnSave />

      {/* === I. PORTRAIT HERO — the conductor first === */}
      <header className="director-hero" data-live-field="hero">
        <div className="director-hero__halo" aria-hidden />
        <div className="director-hero__inner">
          <figure
            className="director-hero__media"
            data-live-field="photo" data-live-owner={owner}
            style={{ ['--ratio' as string]: photoRatio } as React.CSSProperties}
          >
            <Image
              src={photo?.url || directorPlaceholder}
              alt={photo?.alt || `${director.name}, ${director.role}`}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 45vw"
              style={{ objectFit: 'cover', objectPosition: '50% 20%' }}
            />
            <figcaption className="director-hero__caption">
              <span className="velvet-mark on-dark" aria-hidden />
              <span>{director.name}</span>
              <span className="director-hero__caption-role">{director.role}</span>
            </figcaption>
          </figure>

          <div className="director-hero__text">
            <p className="eyebrow eyebrow--gold">{hero.eyebrow}</p>
            <h1 className="director-hero__name" data-live-field="name" data-live-owner={owner}>
              <span>{firstName}</span>
              {lastName && <em>{lastName}</em>}
            </h1>
            <p className="director-hero__role" data-live-field="role" data-live-owner={owner}>
              {director.role}
              {director.instrument ? ` · ${director.instrument}` : ''}
            </p>
            <p className="director-hero__lede" data-live-field="tagline" data-live-owner={owner}>{lede}</p>

            <dl className="director-facts">
              {facts.map((fact, i) => (
                <div key={i}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>

            <div className="director-hero__cta">
              {hero.ctaPrimaryText && (
                <Link href={hero.ctaPrimaryLink} className="btn-filled">
                  {hero.ctaPrimaryText} →
                </Link>
              )}
              {hero.ctaSecondaryText && (
                <Link href={hero.ctaSecondaryLink} className="link-arrow link-arrow--mute">
                  {hero.ctaSecondaryText}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* === II. LE CHEF — long-form bio === */}
      <section id="portrait" className="director-story" data-live-field="story">
        <header className="director-story__head">
          <p className="eyebrow eyebrow--gold">{story.eyebrow}</p>
          <h2 className="director-story__title">{renderEmphasis(story.title)}</h2>
          <hr className="velvet-rule" />
        </header>

        <div className="director-story__body" data-live-field="bio" data-live-owner={owner}>
          {paragraphs.map((p, i) => (
            <p key={i} data-lead={i === 0 ? 'true' : undefined}>
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* === III. PARCOURS — formation, distinctions, vidéo (si renseignés) === */}
      {hasPath && (
        <section className="director-path" data-live-field="path">
          <div className="director-path__inner">
            <header className="director-path__head">
              <p className="eyebrow eyebrow--gold">{path.eyebrow}</p>
              <h2 className="director-path__title">{renderEmphasis(path.title)}</h2>
            </header>

            {(formation.length > 0 || concours.length > 0) && (
              <div className="director-path__grid">
                {formation.length > 0 && (
                  <section className="musician-feature__credits-block" data-live-field="formation" data-live-owner={owner}>
                    <h3 className="musician-feature__credits-title">Formation</h3>
                    <ul className="musician-feature__credits-list">
                      {formation.map((f, i) => (
                        <li key={i}>{f.item}</li>
                      ))}
                    </ul>
                  </section>
                )}
                {concours.length > 0 && (
                  <section className="musician-feature__credits-block" data-live-field="concours" data-live-owner={owner}>
                    <h3 className="musician-feature__credits-title">Concours et distinctions</h3>
                    <ul className="musician-feature__credits-list">
                      {concours.map((c, i) => (
                        <li key={i}>{c.item}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}

            {embedUrl && (
              <div className="director-path__video" data-live-field="videoUrl" data-live-owner={owner}>
                <h3 className="musician-feature__credits-title">En vidéo</h3>
                <div className="musician-feature__video-frame">
                  <iframe
                    src={embedUrl}
                    title={`Vidéo — ${director.name}`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* === IV. SIGNATURE QUOTE === */}
      {director.quote && (
        <section className="director-signature" data-live-field="quote" data-live-owner={owner}>
          <figure>
            <QuotationGlyph />
            <blockquote>{director.quote}</blockquote>
            <figcaption>
              <span className="director-signature__rule" aria-hidden />
              <span className="director-signature__name">{director.name}</span>
              <span className="director-signature__role">{director.role}</span>
            </figcaption>
          </figure>
        </section>
      )}

      {/* === V. ENCORE — outro === */}
      <section className="director-encore" data-live-field="encore">
        <p className="eyebrow eyebrow--gold eyebrow--centered">{encore.eyebrow}</p>
        <h2 className="director-encore__title">{renderEmphasis(encore.title)}</h2>
        <hr className="velvet-rule long centered" />
        <div className="director-encore__links">
          {encore.cards.map((card, i) => (
            <Link key={i} href={card.link} className="director-encore__card">
              {card.eyebrow && <span className="director-encore__card-eyebrow">{card.eyebrow}</span>}
              <span className="director-encore__card-title">{renderEmphasis(card.title)}</span>
              <span className="link-arrow">{card.linkLabel} →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
