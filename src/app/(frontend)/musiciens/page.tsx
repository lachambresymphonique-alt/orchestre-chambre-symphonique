import type { Metadata } from 'next';
import { cache } from 'react';
import { getPayloadClient } from '@/lib/payload';
import { MusiciansClient, type Musician } from './MusiciansClient';

const getMusiciansPage = cache(async () => {
  const payload = await getPayloadClient();
  try {
    return (await payload.findGlobal({ slug: 'musicians-page' as any })) as any;
  } catch {
    return null;
  }
});

export async function generateMetadata(): Promise<Metadata> {
  const page = await getMusiciansPage();
  return {
    alternates: { canonical: '/musiciens' },
    title: page?.seo?.metaTitle || 'Musiciens — La Chambre Symphonique',
    description:
      page?.seo?.metaDescription ||
      "Les musiciens de l'Orchestre de la Chambre Symphonique, dirigé par Loïc Emmelin.",
  };
}

export default async function Musiciens() {
  const payload = await getPayloadClient();
  // Titles editable in Pages → Page Musiciens.
  const page = await getMusiciansPage();
  const musicians = await payload.find({
    collection: 'musicians' as any,
    sort: 'order' as any,
    limit: 100,
    depth: 1,
  });
  return <MusiciansClient page={page} musicians={musicians.docs as Musician[]} />;
}
