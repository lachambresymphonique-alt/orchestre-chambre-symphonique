import type { Metadata } from 'next';
import { cache } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getPayloadClient } from '@/lib/payload';
import { RefreshOnSave } from '@/components/RefreshOnSave';
import { directorPlaceholder } from '@/lib/unsplash';
import { toEmbedUrl } from '@/lib/videoEmbed';
import { DIRECTOR_FALLBACK } from '@/lib/directorDefaults';

type Director = {
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

const getDirector = cache(async (): Promise<Director | null> => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'musicians' as any,
    where: { section: { equals: 'direction' } } as any,
    sort: 'order' as any,
    limit: 1,
    depth: 1,
  });
  return ((result.docs?.[0] as Director) || null) ?? null;
});

export async function generateMetadata(): Promise<Metadata> {
  const director = await getDirector();
  const name = director?.name || 'Direction artistique';
  const role = director?.role || 'Chef d\'orchestre';
  const photoUrl = director?.photo?.url;
  return {
    alternates: { canonical: '/directeur-artistique' },
    title: `${name}, ${role.charAt(0).toLowerCase() + role.slice(1)} — La Chambre Symphonique`,
    description:
      director?.tagline ||
      `${name}, ${role.charAt(0).toLowerCase() + role.slice(1)} et fondateur de La Chambre Symphonique. ${DIRECTOR_FALLBACK.lede}`,
    ...(photoUrl ? { openGraph: { images: [{ url: photoUrl }] } } : {}),
  };
}

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

export default async function DirectorPage() {
  const director = await getDirector();

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
  // Biographie de secours tant que la fiche n'est pas remplie (voir lib/directorDefaults.ts).
  const paragraphs = bioParagraphs.length > 0 ? bioParagraphs : DIRECTOR_FALLBACK.bio;
  const lede = director.tagline?.trim() || DIRECTOR_FALLBACK.lede;

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
      <header className="director-hero">
        <div className="director-hero__halo" aria-hidden />
        <div className="director-hero__inner">
          <figure
            className="director-hero__media"
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
            <p className="eyebrow eyebrow--gold">Direction artistique &nbsp;·&nbsp; Fondateur</p>
            <h1 className="director-hero__name">
              <span>{firstName}</span>
              {lastName && <em>{lastName}</em>}
            </h1>
            <p className="director-hero__role">
              {director.role}
              {director.instrument ? ` · ${director.instrument}` : ''}
            </p>
            <p className="director-hero__lede">{lede}</p>

            <dl className="director-facts">
              <div>
                <dt>Fonction</dt>
                <dd>{director.role}</dd>
              </div>
              <div>
                <dt>Fondateur</dt>
                <dd>La Chambre Symphonique, 2017</dd>
              </div>
              <div>
                <dt>{director.instrument ? 'Instrument' : 'Parcours'}</dt>
                <dd>{director.instrument || DIRECTOR_FALLBACK.background}</dd>
              </div>
            </dl>

            <div className="director-hero__cta">
              <Link href="/#concerts" className="btn-filled">
                Prochains concerts →
              </Link>
              <Link href="/contact" className="link-arrow link-arrow--mute">
                Contacter l'orchestre
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* === II. LE CHEF — long-form bio === */}
      <section id="portrait" className="director-story">
        <header className="director-story__head">
          <p className="eyebrow eyebrow--gold">Le chef</p>
          <h2 className="director-story__title">
            Une lecture <em>vivante</em> du grand répertoire
          </h2>
          <hr className="velvet-rule" />
        </header>

        <div className="director-story__body">
          {paragraphs.map((p, i) => (
            <p key={i} data-lead={i === 0 ? 'true' : undefined}>
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* === III. PARCOURS — formation, distinctions, vidéo (si renseignés) === */}
      {hasPath && (
        <section className="director-path">
          <div className="director-path__inner">
            <header className="director-path__head">
              <p className="eyebrow eyebrow--gold">Parcours</p>
              <h2 className="director-path__title">
                Formation <em>&amp; distinctions</em>
              </h2>
            </header>

            {(formation.length > 0 || concours.length > 0) && (
              <div className="director-path__grid">
                {formation.length > 0 && (
                  <section className="musician-feature__credits-block">
                    <h3 className="musician-feature__credits-title">Formation</h3>
                    <ul className="musician-feature__credits-list">
                      {formation.map((f, i) => (
                        <li key={i}>{f.item}</li>
                      ))}
                    </ul>
                  </section>
                )}
                {concours.length > 0 && (
                  <section className="musician-feature__credits-block">
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
              <div className="director-path__video">
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
        <section className="director-signature">
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
      <section className="director-encore">
        <p className="eyebrow eyebrow--gold eyebrow--centered">Et après</p>
        <h2 className="director-encore__title">
          L'orchestre, <em>c'est aussi</em>
        </h2>
        <hr className="velvet-rule long centered" />
        <div className="director-encore__links">
          <Link href="/musiciens" className="director-encore__card">
            <span className="director-encore__card-eyebrow">Les musiciens</span>
            <span className="director-encore__card-title">
              Quarante à quatre-vingts <em>complices</em>
            </span>
            <span className="link-arrow">Voir l'effectif →</span>
          </Link>
          <Link href="/#concerts" className="director-encore__card">
            <span className="director-encore__card-eyebrow">La saison</span>
            <span className="director-encore__card-title">
              Les <em>prochains concerts</em>
            </span>
            <span className="link-arrow">Voir la programmation →</span>
          </Link>
          <Link href="/nous-soutenir" className="director-encore__card">
            <span className="director-encore__card-eyebrow">Soutenir</span>
            <span className="director-encore__card-title">
              Devenir un <em>mécène</em>
            </span>
            <span className="link-arrow">Nous soutenir →</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
