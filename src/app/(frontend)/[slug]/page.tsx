import { getPayloadClient } from '@/lib/payload';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { RichText } from '@payloadcms/richtext-lexical/react';

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
    return {
      title: page.title,
      description: (page.meta as any)?.description || undefined,
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

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="section-label">Page</div>
          <h1 className="section-title">{page.title}</h1>
          <div className="rich-text-content">
            <RichText data={page.content} />
          </div>
        </div>
      </section>
    </main>
  );
}
