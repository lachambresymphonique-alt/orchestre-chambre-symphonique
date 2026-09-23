'use client';

import Link from 'next/link';
import Image from 'next/image';
import { RefreshOnSave } from '@/components/RefreshOnSave';
import { PostRichText } from '@/components/PostRichText';
import { useLiveDoc } from '@/hooks/useLiveDocument';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { postCategory } from '@/lib/postCategories';
import { describePostDate, imageOf, type ConcertRef, type PostDoc } from '@/lib/postFormat';
import { describeConcertDate } from '@/lib/concerts';

/**
 * Article du blog, rendu côté client pour l'aperçu en direct : chaque
 * modification faite dans l'admin s'affiche aussitôt, avant d'enregistrer.
 */

function guestMusicianHref(post: PostDoc): string | null {
  const m = post.guest?.musician;
  if (!m || typeof m !== 'object') return null;
  const handle = m.slug || m.id;
  return handle ? `/musiciens/${handle}` : null;
}

function linkedConcerts(post: PostDoc): ConcertRef[] {
  const list = post.project?.concerts;
  if (!Array.isArray(list)) return [];
  return list
    .filter((c): c is ConcertRef => !!c && typeof c === 'object')
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
}

export function PostArticle({
  post: initialPost,
  preview,
  related,
}: {
  post: PostDoc;
  preview: boolean;
  related: PostDoc[];
}) {
  const post = useLiveDoc<PostDoc>('posts', initialPost, 2);
  useLivePreviewSync(null);
  const cat = postCategory(post.category);
  const date = describePostDate(post.publishedAt);
  const cover = imageOf(post.cover);
  const guestHref = guestMusicianHref(post);
  const concerts = post.category === 'projet' ? linkedConcerts(post) : [];
  const gallery = (post.gallery || [])
    .map((g) => ({ image: imageOf(g.image), caption: g.caption?.trim() || '' }))
    .filter((g): g is { image: NonNullable<ReturnType<typeof imageOf>>; caption: string } => !!g.image);

  return (
    <article className="post-page">
      <RefreshOnSave />

      {preview && (
        <div className="musician-preview-banner" role="status">
          <span className="musician-preview-banner__dot" aria-hidden />
          <span>
            <strong>Aperçu</strong> — cet article n’est pas encore visible du public
            (<em>brouillon</em> ou date de publication à venir). Seules les personnes
            connectées à l’administration le voient.
          </span>
        </div>
      )}

      {/* === I. En-tête === */}
      <header className={`post-hero${cover ? ' post-hero--with-cover' : ''}`}>
        <div className="post-hero__inner">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> &nbsp;/&nbsp; <Link href="/blog">Blog</Link>{' '}
            &nbsp;/&nbsp;{' '}
            <Link href={`/blog?rubrique=${post.category}`}>{cat.plural}</Link>
          </p>

          <p className="post-hero__meta">
            <span>{cat.label}</span>
            {date && (
              <>
                <span className="dot" aria-hidden>·</span>
                <time dateTime={date.iso}>{date.long}</time>
              </>
            )}
            {post.category === 'projet' && post.project?.period && (
              <>
                <span className="dot" aria-hidden>·</span>
                <span>{post.project.period}</span>
              </>
            )}
          </p>

          <h1 className="post-hero__title" data-live-field="title">{post.title}</h1>

          {post.excerpt && <p className="post-hero__lede" data-live-field="excerpt">{post.excerpt}</p>}

          {post.category === 'entretien' && post.guest?.name && (
            <p className="post-hero__guest">
              <span>
                Entretien avec <em>{post.guest.name}</em>
                {post.guest.role ? `, ${post.guest.role}` : ''}
              </span>
              {guestHref && (
                <Link href={guestHref} className="link-arrow link-arrow--on-dark">
                  Sa fiche →
                </Link>
              )}
            </p>
          )}
        </div>
      </header>

      {cover && (
        <figure className="post-cover">
          <div className="post-cover__frame">
            <Image
              src={cover.url}
              alt={cover.alt || post.title}
              fill
              priority
              sizes="(max-width: 1480px) 100vw, 1480px"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </figure>
      )}

      {/* === II. Texte === */}
      <section className="post-body">
        <div className="rich-text-content post-prose">
          <div data-live-field="content">
            <PostRichText data={post.content} />
          </div>
        </div>
      </section>

      {/* === III. Galerie (optionnelle) === */}
      {gallery.length > 0 && (
        <section className="post-gallery" aria-label="Galerie photos">
          <header className="post-section__head">
            <p className="eyebrow eyebrow--gold">En images</p>
            <hr className="velvet-rule" />
          </header>
          <div className="post-gallery__grid">
            {gallery.map((g, i) => (
              <figure key={i}>
                <div className="post-gallery__frame">
                  <Image
                    src={g.image.url}
                    alt={g.image.alt || g.caption || `${post.title} — photo ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                {g.caption && <figcaption>{g.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* === IV. Dates du projet (optionnel) === */}
      {concerts.length > 0 && (
        <section className="post-concerts" aria-label="Les dates du projet">
          <header className="post-section__head">
            <p className="eyebrow eyebrow--gold">Les dates du projet</p>
            <hr className="velvet-rule" />
          </header>
          <ol className="post-concerts__list">
            {concerts.map((c) => {
              const d = describeConcertDate(c.date, c.time);
              return (
                <li key={c.id} className="post-concert">
                  <span className="post-concert__date">
                    {d ? `${d.day} ${d.month} ${d.year}` : '—'}
                    {d?.time ? ` · ${d.time}` : ''}
                  </span>
                  <div>
                    <h3 className="post-concert__title">
                      {c.slug && c.status !== 'draft' ? (
                        <Link href={`/concerts/${c.slug}`} className="concert-title-link">
                          {c.title}
                        </Link>
                      ) : (
                        c.title
                      )}
                    </h3>
                    {c.venue && <p className="post-concert__venue">{c.venue}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* === V. Pied : lire aussi, retour === */}
      <footer className="post-foot">
        <hr className="velvet-rule long" />

        {related.length > 0 && (
          <section className="post-related" aria-label="Lire aussi">
            <p className="eyebrow eyebrow--gold">Lire aussi</p>
            <ul className="post-related__list">
              {related.map((r) => {
                const rc = postCategory(r.category);
                const rd = describePostDate(r.publishedAt);
                return (
                  <li key={r.id}>
                    <Link href={`/blog/${r.slug}`} className="post-related__card">
                      <span className="post-related__kicker">{rc.short}</span>
                      <span className="post-related__title">{r.title}</span>
                      {rd && <span className="post-related__date">{rd.long}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <Link href="/blog" className="link-arrow link-arrow--mute">
          ← Tout le blog
        </Link>
      </footer>

    </article>
  );
}
