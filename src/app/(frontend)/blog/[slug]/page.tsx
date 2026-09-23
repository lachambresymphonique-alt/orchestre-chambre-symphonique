import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { postCategory } from '@/lib/postCategories';
import { PostArticle } from './PostArticle';
import {
  findPostByPreviousSlug,
  findPostBySlug,
  findRelatedPosts,
  imageOf,
  isEditorRequest,
  type PostDoc,
} from '@/lib/posts';

const SITE_URL = 'https://www.lachambresymphonique.fr';

type Args = { params: Promise<{ slug: string }> };

type Loaded = { post: PostDoc | null; preview: boolean; redirectTo: string | null };

/**
 * Article publié en priorité. À défaut, si la personne est connectée à
 * l’admin, on sert la dernière version (brouillon ou parution programmée)
 * pour l’aperçu en direct. Enfin, une ancienne adresse renvoie vers la
 * nouvelle (redirection permanente, voir `slugHistory` dans la collection).
 */
async function loadPost(slug: string): Promise<Loaded> {
  const published = await findPostBySlug(slug, false);
  if (published) return { post: published, preview: false, redirectTo: null };
  if (await isEditorRequest()) {
    const latest = await findPostBySlug(slug, true);
    if (latest) return { post: latest, preview: true, redirectTo: null };
  }
  const moved = await findPostByPreviousSlug(slug);
  if (moved?.slug && moved.slug !== slug) {
    return { post: null, preview: false, redirectTo: `/blog/${moved.slug}` };
  }
  return { post: null, preview: false, redirectTo: null };
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const { post, preview } = await loadPost(slug);
  if (!post) return { title: 'Article introuvable', robots: { index: false } };

  const cat = postCategory(post.category);
  const og = imageOf(post.meta?.image) || imageOf(post.cover);
  const description =
    post.meta?.description || post.excerpt || `${cat.label} — le blog de La Chambre Symphonique.`;
  const url = `/blog/${post.slug}`;
  // Sans image propre, on ne renseigne pas `images` : l'image Open Graph
  // par défaut du site (opengraph-image.tsx) s'applique alors.
  const images = og
    ? [
        {
          url: og.url,
          alt: og.alt || post.title,
          ...(og.width && og.height ? { width: og.width, height: og.height } : {}),
        },
      ]
    : undefined;

  // Next.js remplace le bloc openGraph du layout par celui de la page (pas de
  // fusion) : on redonne donc ici le nom du site, la langue et l'URL.
  return {
    title: `${post.title} — La Chambre Symphonique`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      locale: 'fr_FR',
      siteName: 'La Chambre Symphonique',
      url,
      title: post.title,
      description,
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt || undefined,
      section: cat.label,
      authors: ['La Chambre Symphonique'],
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      ...(images ? { images } : {}),
    },
    ...(preview ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function PostPage({ params }: Args) {
  const { slug } = await params;
  const { post, preview, redirectTo } = await loadPost(slug);
  if (redirectTo) permanentRedirect(redirectTo);
  if (!post) notFound();

  const cat = postCategory(post.category);
  const cover = imageOf(post.cover);

  let related: PostDoc[] = [];
  try {
    related = preview ? [] : await findRelatedPosts(post, 3);
  } catch {
    related = [];
  }

  const description = post.meta?.description || post.excerpt || undefined;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description,
    datePublished: post.publishedAt || undefined,
    dateModified: post.updatedAt || post.publishedAt || undefined,
    articleSection: cat.label,
    ...(cover ? { image: [cover.url] } : {}),
    author: { '@type': 'Organization', name: 'La Chambre Symphonique', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'La Chambre Symphonique', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <>
      <PostArticle post={post} preview={preview} related={related} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
