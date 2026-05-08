import { getPayloadClient } from '@/lib/payload';
import { HomeClient } from './HomeClient';

export default async function Home() {
  const payload = await getPayloadClient();

  const [homePage, concerts, partners, directorRes, musiciansRes] = await Promise.all([
    payload.findGlobal({ slug: 'home-page' as any, depth: 1 }),
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

  return (
    <HomeClient
      initialData={homePage as any}
      concerts={concerts.docs as any[]}
      partners={partners.docs as any[]}
      director={(directorRes.docs?.[0] as any) || null}
      musiciansSample={musiciansRes.docs as any[]}
    />
  );
}
