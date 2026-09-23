import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getPayloadClient } from '@/lib/payload';
import { findUpcomingConcerts } from '@/lib/concerts';
import { RefreshOnSave } from '@/components/RefreshOnSave';
import { SoloistDetail, type SoloistDoc } from './SoloistDetail';

/** Soliste par son adresse (slug), ou par son identifiant tant qu'il n'a pas de slug. */
const getSoloist = cache(async (handle: string): Promise<SoloistDoc | null> => {
  const payload = await getPayloadClient();
  const bySlug = await payload.find({
    collection: 'soloists' as any,
    where: { slug: { equals: handle } } as any,
    limit: 1,
    depth: 1,
  });
  if (bySlug.docs?.[0]) return bySlug.docs[0] as unknown as SoloistDoc;
  if (!/^\d+$/.test(handle)) return null;
  try {
    return (await payload.findByID({ collection: 'soloists' as any, id: handle, depth: 1 })) as unknown as SoloistDoc;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSoloist(slug);
  if (!s) return { title: 'Soliste introuvable', robots: { index: false } };
  const photo = s.photo && typeof s.photo === 'object' ? s.photo.url : null;
  return {
    title: `${s.name}${s.instrument ? `, ${s.instrument.toLowerCase()}` : ''} — La Chambre Symphonique`,
    description: s.tagline || s.bio?.slice(0, 160) || `${s.name}, soliste invité·e de La Chambre Symphonique.`,
    alternates: { canonical: `/solistes/${s.slug || slug}` },
    ...(photo ? { openGraph: { images: [{ url: photo }] } } : {}),
  };
}

export default async function SoloistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const soloist = await getSoloist(slug);
  if (!soloist) notFound();

  // Ses prochains concerts avec l'orchestre (champ « Solistes » des concerts).
  let concerts: Awaited<ReturnType<typeof findUpcomingConcerts>> = [];
  try {
    const payload = await getPayloadClient();
    concerts = (await findUpcomingConcerts(payload as any, { limit: 30 })).filter((c) =>
      c.soloists.some((x) => String(x.id) === String(soloist.id)),
    );
  } catch {
    concerts = [];
  }

  return (
    <>
      <RefreshOnSave />
      <SoloistDetail soloist={soloist} concerts={concerts} />
    </>
  );
}
