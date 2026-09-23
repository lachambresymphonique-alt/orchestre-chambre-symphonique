/**
 * Accès aux articles du blog côté site (Local API Payload).
 * Un article est « visible » s’il est publié ET si sa date de publication
 * est passée — ce qui permet de programmer une parution.
 */
import { cache } from 'react';
import { headers } from 'next/headers';
import { getPayloadClient } from './payload';
import type { PostCategory } from './postCategories';

export const POSTS_PER_PAGE = 10;

export * from './postFormat';
import { type PostDoc } from './postFormat';

const visibleWhere = () => [
  { _status: { equals: 'published' } },
  { publishedAt: { less_than_equal: new Date().toISOString() } },
];

type ListArgs = { category?: PostCategory | null; page?: number; limit?: number };

export async function findPublishedPosts({ category, page = 1, limit = POSTS_PER_PAGE }: ListArgs) {
  const payload = await getPayloadClient();
  const and: Record<string, unknown>[] = visibleWhere();
  if (category) and.push({ category: { equals: category } });
  return payload.find({
    collection: 'posts' as any,
    where: { and } as any,
    sort: '-publishedAt',
    page,
    limit,
    depth: 1,
  });
}

/**
 * Un article par son slug. Avec `includeDrafts`, renvoie la dernière version
 * (brouillon compris) sans condition de statut ni de date — réservé à
 * l’aperçu pour les personnes connectées à l’admin.
 */
export const findPostBySlug = cache(
  async (slug: string, includeDrafts = false): Promise<PostDoc | null> => {
    const payload = await getPayloadClient();
    const where = includeDrafts
      ? { slug: { equals: slug } }
      : { and: [{ slug: { equals: slug } }, ...visibleWhere()] };
    const result = await payload.find({
      collection: 'posts' as any,
      where: where as any,
      limit: 1,
      depth: 2,
      draft: includeDrafts,
    });
    return (result.docs[0] as PostDoc) || null;
  },
);

/** Jusqu’à `limit` autres articles : même rubrique d’abord, puis les autres. */
export async function findRelatedPosts(post: PostDoc, limit = 3): Promise<PostDoc[]> {
  const payload = await getPayloadClient();
  const base = [...visibleWhere(), { id: { not_equals: post.id } }];
  const find = (extra: Record<string, unknown>, n: number) =>
    payload.find({
      collection: 'posts' as any,
      where: { and: [...base, extra] } as any,
      sort: '-publishedAt',
      limit: n,
      depth: 1,
    });

  const same = await find({ category: { equals: post.category } }, limit);
  let docs = same.docs as PostDoc[];
  if (docs.length < limit) {
    const others = await find({ category: { not_equals: post.category } }, limit - docs.length);
    docs = [...docs, ...(others.docs as PostDoc[])];
  }
  return docs;
}

/** Vrai si la requête porte un cookie de session admin Payload valide. */
export const isEditorRequest = cache(async (): Promise<boolean> => {
  try {
    const payload = await getPayloadClient();
    const { user } = await payload.auth({ headers: await headers() });
    return !!user;
  } catch {
    return false;
  }
});

/**
 * Article visible dont l’une des anciennes adresses est `slug` — pour
 * rediriger les liens partagés avant un changement d’adresse.
 */
export const findPostByPreviousSlug = cache(async (slug: string): Promise<PostDoc | null> => {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'posts' as any,
      where: { and: [{ 'slugHistory.slug': { equals: slug } }, ...visibleWhere()] } as any,
      sort: '-updatedAt',
      limit: 1,
      depth: 0,
    });
    return (result.docs[0] as PostDoc) || null;
  } catch {
    // Une adresse inconnue doit donner un 404, jamais une erreur serveur.
    return null;
  }
});
