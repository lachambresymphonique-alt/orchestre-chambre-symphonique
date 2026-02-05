import type { Metadata } from 'next';
import { getPayloadClient } from '@/lib/payload';
import { AboutClient } from './AboutClient';

export const metadata: Metadata = {
  title: 'À propos — La Chambre Symphonique',
  description:
    "Découvrez l'histoire de La Chambre Symphonique, orchestre fondé en 2017 par Loïc Emmelin, et son parcours de violoniste et chef d'orchestre.",
};

export default async function APropos() {
  const payload = await getPayloadClient();

  const [aboutPage, timelineEvents] = await Promise.all([
    payload.findGlobal({ slug: 'about-page' as any }),
    payload.find({ collection: 'timeline-events' as any }),
  ]);

  return (
    <AboutClient
      initialData={aboutPage as any}
      timelineEvents={timelineEvents.docs as any[]}
    />
  );
}
