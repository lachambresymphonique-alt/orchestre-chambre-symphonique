import type { Metadata } from 'next';
import { cache } from 'react';
import { getPayloadClient } from '@/lib/payload';
import { parseVideoUrl, resolveVimeoThumbnail } from '@/lib/video';
import { MediasClient } from './MediasClient';

const getMediaPage = cache(async () => {
  const payload = await getPayloadClient();
  try {
    return (await payload.findGlobal({ slug: 'media-page' as any })) as any;
  } catch {
    return null;
  }
});

export async function generateMetadata(): Promise<Metadata> {
  const page = await getMediaPage();
  return {
    alternates: { canonical: '/medias' },
    title: page?.seo?.metaTitle || 'Médias — La Chambre Symphonique',
    description:
      page?.seo?.metaDescription ||
      "Vidéos, enregistrements et galerie photos de La Chambre Symphonique, orchestre dirigé par Loïc Emmelin.",
  };
}

export default async function Medias() {
  const payload = await getPayloadClient();
  // Titles editable in Pages → Page Médias.
  const page = await getMediaPage();

  const mediaItems = await payload.find({
    collection: 'media-items' as any,
    sort: 'order' as any,
    limit: 50,
    depth: 1,
  });
  const items = mediaItems.docs as any[];

  // Miniatures Vimeo sans image uploadée : résolues ici (appel réseau côté serveur).
  const vimeoPosters: Record<string, string | null> = {};
  await Promise.all(
    items.map(async (item) => {
      if (item.type !== 'video' || item.thumbnail) return;
      const info = parseVideoUrl(item.url);
      if (info?.provider === 'vimeo') vimeoPosters[String(item.id)] = await resolveVimeoThumbnail(item.url);
    }),
  );

  return <MediasClient page={page} items={items} vimeoPosters={vimeoPosters} />;
}
