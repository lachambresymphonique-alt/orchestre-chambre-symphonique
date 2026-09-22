import type { Metadata } from 'next';
import { getPayloadClient } from '@/lib/payload';
import { findUpcomingConcerts } from '@/lib/concerts';
import { HomeClient } from './HomeClient';

const SITE_URL = 'https://www.lachambresymphonique.fr';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default async function Home() {
  const payload = await getPayloadClient();

  const [homePage, concerts, partners, fallbackDirectorRes, musiciansRes, siteSettings] =
    await Promise.all([
      payload.findGlobal({ slug: 'home-page' as any, depth: 2 }),
      // Only today's and future concerts (Paris time), drafts excluded, soonest first.
      findUpcomingConcerts(payload as any, { limit: 12 }),
      payload.find({ collection: 'partners' as any }),
      payload.find({
        collection: 'musicians' as any,
        where: { section: { equals: 'direction' } } as any,
        sort: 'order' as any,
        limit: 1,
        depth: 1,
      }),
      payload.find({
        collection: 'musicians' as any,
        where: { section: { not_equals: 'direction' } } as any,
        sort: 'order' as any,
        limit: 4,
        depth: 1,
      }),
      payload.findGlobal({ slug: 'site-settings' as any }).catch(() => null),
    ]);

  // Director selected explicitly in HomePage > "À la une" wins; otherwise
  // fall back to the first musician with section === 'direction'.
  const explicit = (homePage as any)?.featured?.director;
  const explicitDirector =
    explicit && typeof explicit === 'object' ? explicit : null;
  const director =
    explicitDirector || (fallbackDirectorRes.docs?.[0] as any) || null;

  // Données structurées (schema.org) — décrit l'orchestre pour Google.
  const social = (siteSettings as any)?.social ?? {};
  const sameAs = [social.facebook, social.instagram, social.youtube, social.linkedin, social.tiktok]
    .filter((url: unknown): url is string => typeof url === 'string' && /^https?:\/\//.test(url));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: 'La Chambre Symphonique',
    alternateName: 'Orchestre de la Chambre Symphonique',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    foundingDate: '2017',
    genre: ['Musique symphonique', 'Musique classique'],
    description:
      'Orchestre fondé en 2017 par Loïc Emmelin, réunissant plus de 80 musiciens autour du répertoire symphonique en Bourgogne et Rhône-Alpes.',
    areaServed: ['Bourgogne', 'Rhône-Alpes'],
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient
        initialData={homePage as any}
        concerts={concerts}
        partners={partners.docs as any[]}
        director={director}
        musiciansSample={musiciansRes.docs as any[]}
      />
    </>
  );
}
