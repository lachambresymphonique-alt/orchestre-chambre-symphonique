import { getPayloadClient } from '@/lib/payload';
import { HomeClient } from './HomeClient';

export default async function Home() {
  const payload = await getPayloadClient();

  const [homePage, concerts, partners, fallbackDirectorRes, musiciansRes] = await Promise.all([
    payload.findGlobal({ slug: 'home-page' as any, depth: 2 }),
    payload.find({ collection: 'concerts' as any, sort: 'order' as any, limit: 6, depth: 1 }),
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
  ]);

  // Director selected explicitly in HomePage > "À la une" wins; otherwise
  // fall back to the first musician with section === 'direction'.
  const explicit = (homePage as any)?.featured?.director;
  const explicitDirector =
    explicit && typeof explicit === 'object' ? explicit : null;
  const director =
    explicitDirector || (fallbackDirectorRes.docs?.[0] as any) || null;

  return (
    <HomeClient
      initialData={homePage as any}
      concerts={concerts.docs as any[]}
      partners={partners.docs as any[]}
      director={director}
      musiciansSample={musiciansRes.docs as any[]}
    />
  );
}
