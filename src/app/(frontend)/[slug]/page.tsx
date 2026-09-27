import { getPayloadClient } from '@/lib/payload';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { FreePageContent } from '@/components/FreePageContent';
import { findUpcomingConcerts, type ConcertCard } from '@/lib/concerts';
import { needsUpcomingConcerts, resolveSections } from '@/lib/sections';

type Args = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'pages' as any,
      where: { slug: { equals: slug } },
      limit: 1,
    });
    const page = result.docs[0] as any;
    if (!page) return {};
    const ogImage = (page.meta as any)?.image;
    const ogImageUrl =
      ogImage && typeof ogImage === 'object' && ogImage.url ? (ogImage.url as string) : undefined;
    return {
      title: page.title,
      description: (page.meta as any)?.description || undefined,
      alternates: { canonical: `/${slug}` },
      ...(ogImageUrl ? { openGraph: { images: [{ url: ogImageUrl }] } } : {}),
    };
  } catch {
    return {};
  }
}

export default async function DynamicPage({ params }: Args) {
  const { slug } = await params;
  let page: any = null;
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'pages' as any,
      where: {
        slug: { equals: slug },
        _status: { equals: 'published' },
      },
      limit: 1,
      // Sections : images, concerts choisis et leurs affiches.
      depth: 2,
    });
    page = result.docs[0] as any;
  } catch {
    // Pages table may not exist yet
  }

  if (!page) notFound();

  // Une section « Concerts » des prochaines dates : chargées ici, côté serveur.
  let upcomingConcerts: ConcertCard[] = [];
  const upcomingLimit = needsUpcomingConcerts(resolveSections(page));
  if (upcomingLimit > 0) {
    try {
      upcomingConcerts = await findUpcomingConcerts((await getPayloadClient()) as any, { limit: upcomingLimit });
    } catch {
      // Sans concerts, la section ne s'affiche simplement pas.
    }
  }

  // Même rendu que l'aperçu en direct de l'admin (/apercu/pages).
  return (
    <FreePageContent
      title={page.title}
      layout={page.layout}
      content={page.content}
      upcomingConcerts={upcomingConcerts}
    />
  );
}
