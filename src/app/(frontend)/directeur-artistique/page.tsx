import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getPayloadClient } from '@/lib/payload';
import { RefreshOnSave } from '@/components/RefreshOnSave';
import { directorPlaceholder } from '@/lib/unsplash';

export const metadata: Metadata = {
  title: 'Directeur artistique — La Chambre Symphonique',
  description:
    "Loïc Emmelin, directeur artistique de l'Orchestre de la Chambre Symphonique. Vision, parcours, citation.",
};

type Director = {
  id?: string;
  name: string;
  role: string;
  instrument?: string;
  photo?: { url?: string; alt?: string } | null;
  tagline?: string;
  bio?: string;
  quote?: string;
};

async function getDirector(): Promise<Director | null> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'musicians' as any,
    where: { section: { equals: 'direction' } } as any,
    sort: 'order' as any,
    limit: 1,
    depth: 1,
  });
  return ((result.docs?.[0] as Director) || null) ?? null;
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

  const firstName = director.name.split(' ')[0];
  const lastName = director.name.split(' ').slice(1).join(' ');
  const bioParagraphs = (director.bio || '').split(/\n\n+/).filter(Boolean);

  return (
    <div className="director-page">
      <RefreshOnSave />

      {/* === I. PROLOGUE === */}
      <header className="director-stage">
        <div className="director-stage__halo" aria-hidden />
        <StaffLine className="director-staff--top" />

        <div className="director-stage__inner">
          <p className="eyebrow eyebrow--gold eyebrow--centered">
            Direction artistique &nbsp;·&nbsp; Fondateur
          </p>

          <h1 className="director-stage__name">
            <span>{firstName}</span>
            <em>{lastName}</em>
          </h1>

          {director.tagline && (
            <p className="director-stage__tagline">« {director.tagline} »</p>
          )}

          <a href="#portrait" aria-label="Faire défiler" className="director-stage__cue">
            <span className="director-stage__cue-line" aria-hidden />
            <span className="director-stage__cue-label">Découvrir le portrait</span>
          </a>
        </div>

        <StaffLine className="director-staff--bottom" />
      </header>

      {/* === II. PORTRAIT === */}
      <section id="portrait" className="director-portrait">
        <div className="director-portrait__frame">
          <div className="director-portrait__media">
            <Image
              src={director.photo?.url || directorPlaceholder}
              alt={director.photo?.alt || director.name}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 80vw"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>

          <figcaption className="director-portrait__caption">
            <span className="velvet-mark on-dark" aria-hidden />
            <span>{director.name}</span>
            <span className="director-portrait__caption-sep" aria-hidden>—</span>
            <span className="director-portrait__caption-role">{director.role}</span>
          </figcaption>
        </div>

        {/* Metadata strip */}
        <dl className="director-credits">
          <div>
            <dt>Fonction</dt>
            <dd>{director.role}</dd>
          </div>
          {director.instrument && (
            <div>
              <dt>Instrument</dt>
              <dd>{director.instrument}</dd>
            </div>
          )}
          <div>
            <dt>L'orchestre</dt>
            <dd>Fondé en 2017</dd>
          </div>
        </dl>
      </section>

      {/* === III. MANIFESTO === */}
      {director.tagline && (
        <section className="director-manifesto">
          <StaffLine className="director-staff--inline" />
          <p className="eyebrow eyebrow--gold eyebrow--centered">Manifeste</p>
          <p className="director-manifesto__text">{director.tagline}</p>
          <StaffLine className="director-staff--inline" />
        </section>
      )}

      {/* === IV. BIO — long-form editorial === */}
      <section className="director-vision">
        <header className="director-vision__head">
          <p className="eyebrow eyebrow--gold">La vision</p>
          <h2 className="director-vision__title">
            Une lecture <em>vivante</em> du grand répertoire
          </h2>
          <hr className="velvet-rule" />
        </header>

        {bioParagraphs.length > 0 ? (
          <div className="director-vision__bio">
            {bioParagraphs.map((p, i) => (
              <p key={i} data-lead={i === 0 ? 'true' : undefined}>
                {p}
              </p>
            ))}
          </div>
        ) : (
          <p className="director-vision__bio-empty">
            <em>La biographie sera publiée prochainement.</em>
          </p>
        )}
      </section>

      {/* === V. SIGNATURE QUOTE === */}
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

      {/* === VI. ENCORE — outro === */}
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
          <Link href="/" className="director-encore__card">
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
