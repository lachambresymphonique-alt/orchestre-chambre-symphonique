import Link from 'next/link';
import Image from 'next/image';
import { placeholderForMusician } from '@/lib/unsplash';
import { toEmbedUrl } from '@/lib/videoEmbed';

export type Musician = {
  id?: string;
  name: string;
  slug?: string;
  role: string;
  instrument?: string;
  section: 'direction' | 'cordes' | 'vents' | 'claviers';
  photo?: { url?: string; alt?: string } | null;
  tagline?: string;
  bio?: string;
  quote?: string;
  formation?: { item: string }[];
  concours?: { item: string }[];
  videoUrl?: string;
  inspiringSymphony?: string;
  favoriteWork?: string;
  favoriteComposer?: string;
};

const sectionLabels: Record<Musician['section'], string> = {
  direction: 'Direction artistique',
  cordes: 'Les Cordes',
  vents: 'Les Vents',
  claviers: 'Claviers & Percussions',
};

type Props = {
  musician: Musician;
  /** Renders a discreet banner explaining this is a preview, hides the back link. */
  previewMode?: boolean;
};

export function MusicianDetail({ musician: m, previewMode = false }: Props) {
  const bioParagraphs = (m.bio || '').split(/\n\n+/).filter(Boolean);
  const embedUrl = toEmbedUrl(m.videoUrl);
  const sectionLabel = m.section ? sectionLabels[m.section] : '—';

  return (
    <div className="musician-detail">
      {previewMode && (
        <div className="musician-preview-banner" role="status">
          <span className="musician-preview-banner__dot" aria-hidden />
          <span>
            <strong>Aperçu</strong> — cette fiche n’est pas encore publiée. Recopiez-la
            dans la collection <em>Musiciens</em> pour la mettre en ligne.
          </span>
        </div>
      )}

      <article className="musician-feature">
        <div className="musician-feature__portrait">
          <Image
            src={m.photo?.url || placeholderForMusician(m.name)}
            alt={m.photo?.alt || m.name}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
          <div className="musician-feature__halo" aria-hidden />
        </div>

        <div className="musician-feature__text">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> &nbsp;/&nbsp;{' '}
            <Link href="/musiciens">Musiciens</Link> &nbsp;/&nbsp;{' '}
            <span className="breadcrumb-current">{sectionLabel}</span>
          </p>

          <p className="eyebrow eyebrow--gold">{m.role}</p>
          <h1 className="musician-feature__name">{m.name}</h1>
          {m.instrument && <p className="musician-feature__instrument">{m.instrument}</p>}

          {m.tagline && (
            <>
              <hr className="velvet-rule long" />
              <p className="musician-feature__tagline">{m.tagline}</p>
            </>
          )}

          {bioParagraphs.length > 0 && (
            <div className="musician-feature__bio">
              {bioParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}

          {(m.inspiringSymphony || m.favoriteWork || m.favoriteComposer) && (
            <dl className="musician-feature__qa">
              {m.inspiringSymphony && (
                <div className="musician-feature__qa-item">
                  <dt>La symphonie qui lui a donné envie de faire de la musique</dt>
                  <dd>{m.inspiringSymphony}</dd>
                </div>
              )}
              {m.favoriteWork && (
                <div className="musician-feature__qa-item">
                  <dt>Œuvre préférée</dt>
                  <dd>{m.favoriteWork}</dd>
                </div>
              )}
              {m.favoriteComposer && (
                <div className="musician-feature__qa-item">
                  <dt>Compositeur préféré</dt>
                  <dd>{m.favoriteComposer}</dd>
                </div>
              )}
            </dl>
          )}

          {(m.formation?.length || m.concours?.length) ? (
            <div className="musician-feature__credits">
              {m.formation && m.formation.length > 0 && (
                <section className="musician-feature__credits-block">
                  <h2 className="musician-feature__credits-title">Formation</h2>
                  <ul className="musician-feature__credits-list">
                    {m.formation.map((f, i) => (
                      <li key={i}>{f.item}</li>
                    ))}
                  </ul>
                </section>
              )}
              {m.concours && m.concours.length > 0 && (
                <section className="musician-feature__credits-block">
                  <h2 className="musician-feature__credits-title">Concours et distinctions</h2>
                  <ul className="musician-feature__credits-list">
                    {m.concours.map((c, i) => (
                      <li key={i}>{c.item}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          ) : null}

          {embedUrl && (
            <div className="musician-feature__video">
              <h2 className="musician-feature__credits-title">En écoute</h2>
              <div className="musician-feature__video-frame">
                <iframe
                  src={embedUrl}
                  title={`Vidéo — ${m.name}`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {m.quote && (
            <figure className="quote-slab">
              <blockquote>{m.quote}</blockquote>
              <figcaption>
                <span className="velvet-mark" aria-hidden /> {m.name}
              </figcaption>
            </figure>
          )}

          {!previewMode && (
            <div className="musician-feature__back">
              <Link href="/musiciens" className="link-arrow">
                ← Retour aux musiciens
              </Link>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
