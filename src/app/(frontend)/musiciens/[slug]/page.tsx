import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPayloadClient } from '@/lib/payload';
import { RefreshOnSave } from '@/components/RefreshOnSave';
import { MusicianDetailLive } from '@/components/MusicianDetailLive';
import type { Musician } from '@/components/MusicianDetail';

async function getMusician(handle: string): Promise<Musician | null> {
  const payload = await getPayloadClient();

  // First try slug
  const bySlug = await payload.find({
    collection: 'musicians' as any,
    where: { slug: { equals: handle } } as any,
    limit: 1,
    depth: 1,
  });
  if (bySlug.docs?.[0]) return bySlug.docs[0] as Musician;

  // Fallback: try id (for existing musicians without slug)
  try {
    const byId = await payload.findByID({
      collection: 'musicians' as any,
      id: handle,
      depth: 1,
    });
    return (byId as Musician) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = await getMusician(slug);
  if (!m) return { title: 'Musicien introuvable', robots: { index: false } };
  const canonicalHandle = (m as any).slug || slug;
  const photoUrl = (m as any).photo?.url as string | undefined;
  return {
    title: `${m.name} — La Chambre Symphonique`,
    description: m.tagline || `${m.role}${m.instrument ? ` — ${m.instrument}` : ''}`,
    alternates: { canonical: `/musiciens/${canonicalHandle}` },
    ...(photoUrl ? { openGraph: { images: [{ url: photoUrl }] } } : {}),
  };
}

export default async function MusicianPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = await getMusician(slug);
  if (!m) notFound();

  // Section names and fiche labels are editable in Pages → Page Musiciens.
  let labels: any = null;
  try {
    const payload = await getPayloadClient();
    labels = await payload.findGlobal({ slug: 'musicians-page' as any });
  } catch {
    labels = null;
  }

  return (
    <>
      <RefreshOnSave />
      <MusicianDetailLive musician={m} labels={labels} />
    </>
  );
}
