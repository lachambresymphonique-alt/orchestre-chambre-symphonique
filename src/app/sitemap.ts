import type { MetadataRoute } from 'next';
import { getPayloadClient } from '@/lib/payload';

const BASE_URL = 'https://www.lachambresymphonique.fr';

// Régénère le sitemap au plus une fois par heure.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Routes statiques connues du site.
  const staticRoutes: MetadataRoute.Sitemap = [
    { path: '', priority: 1, changeFrequency: 'weekly' as const },
    { path: 'concerts', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: 'a-propos', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: 'directeur-artistique', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: 'musiciens', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: 'medias', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: 'blog', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: 'nous-soutenir', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: 'contact', priority: 0.6, changeFrequency: 'yearly' as const },
  ].map(({ path, priority, changeFrequency }) => ({
    url: path ? `${BASE_URL}/${path}` : BASE_URL,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  // Routes dynamiques issues du CMS (pages libres publiées, fiches musiciens, articles du blog).
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const payload = await getPayloadClient();
    const [pages, musicians, posts] = await Promise.all([
      payload.find({
        collection: 'pages' as any,
        where: { _status: { equals: 'published' } } as any,
        limit: 200,
        depth: 0,
      }),
      payload.find({
        collection: 'musicians' as any,
        limit: 500,
        depth: 0,
      }),
      payload
        .find({
          collection: 'posts' as any,
          where: {
            and: [
              { _status: { equals: 'published' } },
              { publishedAt: { less_than_equal: new Date().toISOString() } },
            ],
          } as any,
          limit: 500,
          depth: 0,
        })
        .catch(() => ({ docs: [] as any[] })),
    ]);

    const pageRoutes = (pages.docs as any[])
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${BASE_URL}/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }));

    const musicianRoutes = (musicians.docs as any[])
      .filter((m) => m.slug)
      .map((m) => ({
        url: `${BASE_URL}/musiciens/${m.slug}`,
        lastModified: m.updatedAt ? new Date(m.updatedAt) : new Date(),
        changeFrequency: 'yearly' as const,
        priority: 0.4,
      }));

    const postRoutes = (posts.docs as any[])
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${BASE_URL}/blog/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }));

    // Pages des concerts : publiés ou annulés (brouillons exclus), archives comprises.
    const concerts = await payload
      .find({
        collection: 'concerts' as any,
        where: { and: [{ status: { not_equals: 'draft' } }, { slug: { exists: true } }] } as any,
        limit: 500,
        depth: 0,
      })
      .catch(() => ({ docs: [] as any[] }));
    const concertRoutes = (concerts.docs as any[])
      .filter((c) => c.slug)
      .map((c) => ({
        url: `${BASE_URL}/concerts/${c.slug}`,
        lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

    dynamicRoutes = [...pageRoutes, ...musicianRoutes, ...postRoutes, ...concertRoutes];
  } catch {
    // Base de données indisponible (ex. au build) : on renvoie au moins les routes statiques.
  }

  return [...staticRoutes, ...dynamicRoutes];
}
