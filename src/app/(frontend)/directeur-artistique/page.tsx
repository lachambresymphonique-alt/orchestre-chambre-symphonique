import type { Metadata } from 'next';
import { cache } from 'react';
import { getPayloadClient } from '@/lib/payload';
import { DirectorClient, type Director } from './DirectorClient';
import { resolveDirectorPage, type DirectorPageContent } from '@/lib/directorDefaults';

type PageData = { content: DirectorPageContent; director: Director | null; global: any };

/**
 * Everything on this page is editable in the admin:
 * - Pages → Page Direction: which musician, section titles, buttons, fallback texts;
 * - Musiciens → the conductor's fiche: photo, role, tagline, bio, training, video, quote.
 */
const getPageData = cache(async (): Promise<PageData> => {
  const payload = await getPayloadClient();

  let global: any = null;
  try {
    // depth 2: director → its photo
    global = await payload.findGlobal({ slug: 'director-page' as any, depth: 2 });
  } catch {
    global = null;
  }
  const content = resolveDirectorPage(global);

  let director: Director | null =
    global?.director && typeof global.director === 'object' ? (global.director as Director) : null;

  if (!director) {
    const result = await payload.find({
      collection: 'musicians' as any,
      where: { section: { equals: 'direction' } } as any,
      sort: 'order' as any,
      limit: 1,
      depth: 1,
    });
    director = ((result.docs?.[0] as Director) || null) ?? null;
  }

  return { content, director, global };
});

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export async function generateMetadata(): Promise<Metadata> {
  const { content, director } = await getPageData();
  const name = director?.name || 'Direction artistique';
  const role = director?.role || 'Chef d\'orchestre';
  const photoUrl = director?.photo?.url;
  return {
    alternates: { canonical: '/directeur-artistique' },
    title: content.seo.metaTitle || `${name}, ${lowerFirst(role)} — La Chambre Symphonique`,
    description:
      content.seo.metaDescription ||
      director?.tagline ||
      `${name}, ${lowerFirst(role)} et fondateur de La Chambre Symphonique. ${content.hero.ledeFallback}`,
    ...(photoUrl ? { openGraph: { images: [{ url: photoUrl }] } } : {}),
  };
}

export default async function DirectorPage() {
  const { director, global } = await getPageData();
  // Le musicien choisi dans la Page Direction, sinon le premier de la section.
  const chosen = global?.director && typeof global.director === 'object';
  return <DirectorClient global={global} fallbackDirector={chosen ? null : director} />;
}
