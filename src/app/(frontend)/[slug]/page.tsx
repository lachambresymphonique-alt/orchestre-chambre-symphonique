import { getPayloadClient } from '@/lib/payload';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { FreePageContent } from '@/components/FreePageContent';

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
    });
    page = result.docs[0] as any;
  } catch {
    // Pages table may not exist yet
  }

  if (!page) notFound();

  // Même rendu que l'aperçu en direct de l'admin (/apercu/pages).
  return <FreePageContent title={page.title} content={page.content} />;
}
