import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { RefreshOnSave } from '@/components/RefreshOnSave';
import { FadeIn } from '@/components/FadeIn';
import {
  POST_CATEGORIES,
  isPostCategory,
  postCategory,
  type PostCategory,
} from '@/lib/postCategories';
import { describePostDate, findPublishedPosts, imageOf, type PostDoc } from '@/lib/posts';

type SearchParams = Promise<{ rubrique?: string | string[]; page?: string | string[] }>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function parseParams(sp: Awaited<SearchParams>) {
  const rubrique = first(sp.rubrique);
  const category: PostCategory | null = isPostCategory(rubrique) ? rubrique : null;
  const page = Math.max(1, parseInt(first(sp.page) || '1', 10) || 1);
  return { category, page };
}

function blogHref(category: PostCategory | null, page = 1): string {
  const params = new URLSearchParams();
  if (category) params.set('rubrique', category);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/blog?${qs}` : '/blog';
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { category, page } = parseParams(await searchParams);
  const cat = category ? postCategory(category) : null;
  const title = cat
    ? `${cat.plural} — Blog — La Chambre Symphonique`
    : 'Blog — La Chambre Symphonique';
  const description = cat
    ? `${cat.plural} du blog de La Chambre Symphonique. ${cat.hint}`
    : 'Le blog de La Chambre Symphonique : retours sur les projets passés, entretiens avec les musiciens et actualités de l’orchestre dirigé par Loïc Emmelin.';
  const url = blogHref(category, page);

  // Le bloc openGraph du layout n'est pas fusionné avec celui de la page :
  // on le redéfinit en entier. L'image reste celle du site (opengraph-image.tsx).
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      siteName: 'La Chambre Symphonique',
      url,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    ...(page > 1 ? { robots: { index: false, follow: true } } : {}),
  };
}

/** « Entretien · Marie Dupont », « Projet · Juin 2024 », « Actualité ». */
function kicker(post: PostDoc): string {
  const cat = postCategory(post.category);
  if (post.category === 'entretien' && post.guest?.name) return `${cat.short} · ${post.guest.name}`;
  if (post.category === 'projet' && post.project?.period) return `${cat.short} · ${post.project.period}`;
  return cat.short;
}

function LeadPost({ post }: { post: PostDoc }) {
  const date = describePostDate(post.publishedAt);
  const cover = imageOf(post.cover);
  return (
    <FadeIn>
      <Link href={`/blog/${post.slug}`} className="journal-lead">
        <figure className="journal-lead__media">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt || post.title}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 55vw"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <span className="journal-placeholder" aria-hidden />
          )}
        </figure>
        <div className="journal-lead__text">
          <p className="eyebrow eyebrow--gold">
            {kicker(post)}
            {date && (
              <>
                {' '}&nbsp;·&nbsp;{' '}
                <time dateTime={date.iso}>{date.long}</time>
              </>
            )}
          </p>
          <h2 className="journal-lead__title">{post.title}</h2>
          {post.excerpt && <p className="journal-lead__excerpt">{post.excerpt}</p>}
          <span className="link-arrow">Lire l’article →</span>
        </div>
      </Link>
    </FadeIn>
  );
}

function PostRow({ post }: { post: PostDoc }) {
  const date = describePostDate(post.publishedAt);
  const thumb = imageOf(post.cover, 'card');
  return (
    <li className="journal-row">
      <FadeIn>
        <Link href={`/blog/${post.slug}`} className="journal-row__link">
          <div className="journal-row__date">
            {date ? (
              <>
                <span className="journal-row__day">{date.day}</span>
                <span className="journal-row__month">{date.monthYear}</span>
              </>
            ) : null}
          </div>
          <div className="journal-row__body">
            <p className="journal-row__kicker">{kicker(post)}</p>
            <h2 className="journal-row__title">{post.title}</h2>
            {post.excerpt && <p className="journal-row__excerpt">{post.excerpt}</p>}
          </div>
          <div className="journal-row__media" aria-hidden={!thumb}>
            {thumb ? (
              <Image
                src={thumb.url}
                alt={thumb.alt || post.title}
                fill
                sizes="(max-width: 700px) 100vw, 220px"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <span className="journal-placeholder" aria-hidden />
            )}
          </div>
        </Link>
      </FadeIn>
    </li>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  if (filtered) {
    return (
      <div className="journal-empty">
        <p className="eyebrow eyebrow--gold eyebrow--centered">Rubrique vide</p>
        <h2 className="journal-empty__title">
          Rien ici <em>pour l’instant</em>
        </h2>
        <p>Les articles de cette rubrique arrivent. En attendant, le reste du blog vous attend.</p>
        <hr className="velvet-rule long centered" />
        <Link href="/blog" className="link-arrow">
          Tout le blog →
        </Link>
      </div>
    );
  }
  return (
    <div className="journal-empty">
      <p className="eyebrow eyebrow--gold eyebrow--centered">Bientôt</p>
      <h2 className="journal-empty__title">
        Les premières pages <em>s’écrivent</em>
      </h2>
      <p>
        Retours sur nos concerts, entretiens avec les musiciens, coulisses des projets :
        le blog de l’orchestre ouvre bientôt. En attendant, la musique continue.
      </p>
      <hr className="velvet-rule long centered" />
      <Link href="/#concerts" className="link-arrow">
        Prochains concerts →
      </Link>
    </div>
  );
}

export default async function BlogPage({ searchParams }: { searchParams: SearchParams }) {
  const { category, page } = parseParams(await searchParams);

  let posts: PostDoc[] = [];
  let totalPages = 1;
  let hasPrevPage = false;
  let hasNextPage = false;
  try {
    const result = await findPublishedPosts({ category, page });
    posts = result.docs as PostDoc[];
    totalPages = result.totalPages || 1;
    hasPrevPage = !!result.hasPrevPage;
    hasNextPage = !!result.hasNextPage;
  } catch {
    // Table absente ou base indisponible : on affiche l’état vide.
  }

  const lead = page === 1 ? posts[0] ?? null : null;
  const rows = page === 1 ? posts.slice(1) : posts;

  return (
    <div className="journal-page">
      <RefreshOnSave />

      <div className="page-header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> &nbsp;/&nbsp; Blog
          </p>
          <h1>Le blog</h1>
          <p>
            Retours sur nos projets, entretiens avec celles et ceux qui font l’orchestre,
            et la vie de La Chambre Symphonique entre deux concerts.
          </p>
        </div>
      </div>

      <section className="journal">
        <div className="journal__inner">
          <nav className="journal-filters" aria-label="Rubriques du blog">
            <Link
              href="/blog"
              className={category ? '' : 'is-active'}
              aria-current={category ? undefined : 'page'}
            >
              Tout
            </Link>
            {POST_CATEGORIES.map((c) => (
              <Link
                key={c.value}
                href={blogHref(c.value)}
                className={category === c.value ? 'is-active' : ''}
                aria-current={category === c.value ? 'page' : undefined}
              >
                {c.plural}
              </Link>
            ))}
          </nav>

          {posts.length === 0 ? (
            <EmptyState filtered={!!category || page > 1} />
          ) : (
            <>
              {lead && <LeadPost post={lead} />}

              {rows.length > 0 && (
                <ol className="journal-list">
                  {rows.map((post) => (
                    <PostRow key={post.id} post={post} />
                  ))}
                </ol>
              )}

              {totalPages > 1 && (
                <nav className="journal-pagination" aria-label="Pagination du blog">
                  {hasPrevPage ? (
                    <Link href={blogHref(category, page - 1)} className="link-arrow link-arrow--mute">
                      ← Plus récents
                    </Link>
                  ) : (
                    <span />
                  )}
                  <span className="journal-pagination__page">
                    Page {page} / {totalPages}
                  </span>
                  {hasNextPage ? (
                    <Link href={blogHref(category, page + 1)} className="link-arrow">
                      Plus anciens →
                    </Link>
                  ) : (
                    <span />
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
