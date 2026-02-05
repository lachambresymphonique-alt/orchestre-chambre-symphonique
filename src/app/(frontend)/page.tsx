import { getPayloadClient } from '@/lib/payload';
import { HomeClient } from './HomeClient';

export default async function Home() {
  const payload = await getPayloadClient();

  const [homePage, concerts, partners] = await Promise.all([
    payload.findGlobal({ slug: 'home-page' as any }),
    payload.find({ collection: 'concerts' as any }),
    payload.find({ collection: 'partners' as any }),
  ]);

  return (
    <HomeClient
      initialData={homePage as any}
      concerts={concerts.docs as any[]}
      partners={partners.docs as any[]}
    />
  );
}
