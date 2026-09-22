import type { Metadata } from 'next';
import { cache } from 'react';
import { getPayloadClient } from '@/lib/payload';
import { AboutClient } from './AboutClient';

const getAboutPage = cache(async () => {
  const payload = await getPayloadClient();
  return payload.findGlobal({ slug: 'about-page' as any });
});

export async function generateMetadata(): Promise<Metadata> {
  const aboutPage = (await getAboutPage()) as any;
  return {
    alternates: { canonical: '/a-propos' },
    title: aboutPage?.seo?.metaTitle || 'À propos — La Chambre Symphonique',
    description:
      aboutPage?.seo?.metaDescription ||
      "Découvrez l'histoire de La Chambre Symphonique, orchestre fondé en 2017 par Loïc Emmelin, et son parcours de violoniste et chef d'orchestre.",
  };
}

export default async function APropos() {
  const payload = await getPayloadClient();

  const [aboutPage, timelineEvents] = await Promise.all([
    getAboutPage(),
    payload.find({ collection: 'timeline-events' as any }),
  ]);

  return (
    <AboutClient
      initialData={aboutPage as any}
      timelineEvents={timelineEvents.docs as any[]}
    />
  );
}
