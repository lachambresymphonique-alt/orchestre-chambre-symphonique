import Link from 'next/link';
import Image from 'next/image';
import { skipOptimization } from '@/lib/imageOptimization';
import { placeholderForMusician } from '@/lib/unsplash';
import { toEmbedUrl } from '@/lib/videoEmbed';
import { RichText, renderInline } from '@/lib/richText';
import { linkList, normalizeUrl, shortUrl } from '@/lib/links';
import { instagramUrl, projectList, type Project } from '@/lib/projects';

export type Musician = {
  id?: string;
  name: string;
  slug?: string;
  role: string;
  instrument?: string;
  section: 'direction' | 'cordes' | 'vents' | 'claviers';
  photo?: { url?: string; alt?: string } | null;
  photoCredit?: string | null;
  websiteUrl?: string | null;
  projects?: Partial<Record<keyof Project, string | null>>[] | null;
  /** Premier format des projets (liens sans nom), encore affiché s'il est rempli. */
  projectLinks?: { item?: string | null }[] | null;
  tagline?: string;
  bio?: string;
  quote?: string;
  formation?: { item: string }[];
  concours?: { item: string }[];
  videoUrl?: string;
  inspiringSymphony?: string;
  favoriteWork?: string;
  favoriteComposer?: string;
  desertIslandPiece?: string | null;
};

const defaultSectionLabels: Record<Musician['section'], string> = {
  direction: 'Direction artistique',
  cordes: 'Les Cordes',
  vents: 'Les Vents',
  claviers: 'Claviers & Percussions',
};

/** Labels editable in Pages → Page Musiciens (groups « sections » and « detail »). */
export type MusicianDetailLabels = {
  sections?: Partial<Record<Musician['section'], string | null>> | null;
  detail?: {
    inspiringLabel?: string | null;
    favoriteWorkLabel?: string | null;
    favoriteComposerLabel?: string | null;
    desertIslandLabel?: string | null;
    formationTitle?: string | null;
    concoursTitle?: string | null;
    videoTitle?: string | null;
    backLabel?: string | null;
  } | null;
};

/** « Photo : Nom », sauf si le crédit saisi porte déjà sa mention (« © Nom », « Photo Nom »). */
function photoCreditLine(credit: string): string {
  return /^(©|\(c\)|photo|crédit|credit)/i.test(credit) ? credit : `Photo : ${credit}`;
}

function ExternalLink({ url }: { url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="musician-feature__link">
      {shortUrl(url)}
      {/* Espace insécable : la flèche ne part pas seule à la ligne. */}
      <span aria-hidden>{' '}↗</span>
    </a>
  );
}

/** Liens d'un projet, dans l'ordre d'affichage. */
function projectLinks(p: Project): { label: string; url: string }[] {
  return [
    { label: 'Site', url: p.websiteUrl },
    { label: 'YouTube', url: p.youtubeUrl },
    { label: 'Instagram', url: instagramUrl(p.instagram) },
  ].filter((link) => link.url);
}

type Props = {
  musician: Musician;
  /** Renders a discreet banner explaining this is a preview, hides the back link. */
  previewMode?: boolean;
  labels?: MusicianDetailLabels | null;
};

export function MusicianDetail({ musician: m, previewMode = false, labels }: Props) {
  const hasBio = Boolean(m.bio?.trim());
  const embedUrl = toEmbedUrl(m.videoUrl);
  // Le crédit ne vaut que pour une vraie photo, pas pour les initiales de remplacement.
  const photoCredit = m.photo?.url ? m.photoCredit?.trim() || '' : '';
  const website = normalizeUrl(m.websiteUrl);
  const projects = projectList(m.projects);
  const legacyLinks = linkList(m.projectLinks);
  const hasProjects = projects.length > 0 || legacyLinks.length > 0;
  const sectionLabel = m.section
    ? labels?.sections?.[m.section] || defaultSectionLabels[m.section]
    : '—';
  const t = {
    inspiring: labels?.detail?.inspiringLabel || 'La symphonie qui lui a donné envie de faire de la musique',
    favoriteWork: labels?.detail?.favoriteWorkLabel || 'Œuvre préférée',
    favoriteComposer: labels?.detail?.favoriteComposerLabel || 'Compositeur préféré',
    desertIsland: labels?.detail?.desertIslandLabel || 'Le morceau à emmener sur une île déserte',
    formation: labels?.detail?.formationTitle || 'Formation',
    concours: labels?.detail?.concoursTitle || 'Concours et distinctions',
    video: labels?.detail?.videoTitle || 'En écoute',
    back: labels?.detail?.backLabel || 'Retour aux musiciens',
  };

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
        <figure className="musician-feature__figure">
          <div className="musician-feature__portrait" data-live-field="photo">
            <Image
              src={m.photo?.url || placeholderForMusician(m.name)}
              unoptimized={skipOptimization(m.photo)}
              alt={m.photo?.alt || m.name}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
            <div className="musician-feature__halo" aria-hidden />
          </div>
          {photoCredit && (
            <figcaption className="musician-feature__photo-credit" data-live-field="photoCredit">
              {photoCreditLine(photoCredit)}
            </figcaption>
          )}
        </figure>

        <div className="musician-feature__text">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> &nbsp;/&nbsp;{' '}
            <Link href="/musiciens">Musiciens</Link> &nbsp;/&nbsp;{' '}
            <span className="breadcrumb-current">{sectionLabel}</span>
          </p>

          <p className="eyebrow eyebrow--gold" data-live-field="role">{m.role}</p>
          <h1 className="musician-feature__name" data-live-field="name">{m.name}</h1>
          {m.instrument && <p className="musician-feature__instrument" data-live-field="instrument">{m.instrument}</p>}

          {m.tagline && (
            <>
              <hr className="velvet-rule long" />
              <p className="musician-feature__tagline" data-live-field="tagline">{m.tagline}</p>
            </>
          )}

          {hasBio && (
            <div className="musician-feature__bio rich-text" data-live-field="bio">
              <RichText text={m.bio} />
            </div>
          )}

          {(m.inspiringSymphony || m.favoriteWork || m.favoriteComposer || m.desertIslandPiece) && (
            <dl className="musician-feature__qa">
              {m.inspiringSymphony && (
                <div className="musician-feature__qa-item" data-live-field="inspiringSymphony">
                  <dt>{t.inspiring}</dt>
                  <dd>{m.inspiringSymphony}</dd>
                </div>
              )}
              {m.favoriteWork && (
                <div className="musician-feature__qa-item" data-live-field="favoriteWork">
                  <dt>{t.favoriteWork}</dt>
                  <dd>{m.favoriteWork}</dd>
                </div>
              )}
              {m.favoriteComposer && (
                <div className="musician-feature__qa-item" data-live-field="favoriteComposer">
                  <dt>{t.favoriteComposer}</dt>
                  <dd>{m.favoriteComposer}</dd>
                </div>
              )}
              {m.desertIslandPiece && (
                <div className="musician-feature__qa-item" data-live-field="desertIslandPiece">
                  <dt>{t.desertIsland}</dt>
                  <dd>{m.desertIslandPiece}</dd>
                </div>
              )}
            </dl>
          )}

          {(m.formation?.length || m.concours?.length) ? (
            <div className="musician-feature__credits">
              {m.formation && m.formation.length > 0 && (
                <section className="musician-feature__credits-block" data-live-field="formation">
                  <h2 className="musician-feature__credits-title">{t.formation}</h2>
                  <ul className="musician-feature__credits-list">
                    {m.formation.map((f, i) => (
                      <li key={i}>{f.item}</li>
                    ))}
                  </ul>
                </section>
              )}
              {m.concours && m.concours.length > 0 && (
                <section className="musician-feature__credits-block" data-live-field="concours">
                  <h2 className="musician-feature__credits-title">{t.concours}</h2>
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
            <div className="musician-feature__video" data-live-field="videoUrl">
              <h2 className="musician-feature__credits-title">{t.video}</h2>
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

          {(website || hasProjects) && (
            <div className="musician-feature__credits">
              {website && (
                <section className="musician-feature__credits-block" data-live-field="websiteUrl">
                  <h2 className="musician-feature__credits-title">Site internet</h2>
                  <p className="musician-feature__link-line">
                    <ExternalLink url={website} />
                  </p>
                </section>
              )}
              {hasProjects && (
                <section className="musician-feature__credits-block" data-live-field="projects">
                  <h2 className="musician-feature__credits-title">Autres projets</h2>
                  <ul className="musician-feature__projects">
                    {projects.map((p, i) => {
                      const links = projectLinks(p);
                      return (
                        <li key={i} className="musician-feature__project">
                          <span className="musician-feature__project-name">{p.name}</span>
                          {links.length > 0 && (
                            <span className="musician-feature__project-links">
                              {links.map((link) => (
                                <a
                                  key={link.label}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="musician-feature__link"
                                  aria-label={`${p.name} : ${link.label} (nouvel onglet)`}
                                >
                                  {link.label}
                                  <span aria-hidden>{'\u00A0'}↗</span>
                                </a>
                              ))}
                            </span>
                          )}
                        </li>
                      );
                    })}
                    {legacyLinks.map((url) => (
                      <li key={url} className="musician-feature__project">
                        <ExternalLink url={url} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {m.quote && (
            <figure className="quote-slab" data-live-field="quote">
              <blockquote>{renderInline(m.quote)}</blockquote>
              <figcaption>
                <span className="velvet-mark" aria-hidden /> {m.name}
              </figcaption>
            </figure>
          )}

          {!previewMode && (
            <div className="musician-feature__back">
              <Link href="/musiciens" className="link-arrow">
                ← {t.back}
              </Link>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
