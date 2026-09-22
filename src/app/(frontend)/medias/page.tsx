import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FadeIn } from '@/components/FadeIn';
import { ImagePlaceholder } from '@/components/PlaceholderIcon';
import { MediaTabs } from '@/components/MediaTabs';
import { VideoCard } from '@/components/VideoCard';
import { getPayloadClient } from '@/lib/payload';
import { parseVideoUrl, resolveVimeoThumbnail } from '@/lib/video';
import { RefreshOnSave } from '@/components/RefreshOnSave';

export const metadata: Metadata = {
  alternates: { canonical: '/medias' },
  title: 'Médias — La Chambre Symphonique',
  description:
    "Vidéos, enregistrements et galerie photos de La Chambre Symphonique, orchestre dirigé par Loïc Emmelin.",
};

function MusicIcon() {
  return (
    <div className="play-icon">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    </div>
  );
}

// Lien qui recouvre toute la vignette, icône centrée (mêmes styles que VideoCard).
const overlayLink: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  display: 'grid',
  placeItems: 'center',
  color: 'inherit',
};

/** URL d'une image uploadée dans la bibliothèque, dans la taille demandée si elle existe. */
function uploadUrl(thumb: any, size: 'thumbnail' | 'card'): string | null {
  if (!thumb || typeof thumb !== 'object') return null;
  return thumb.sizes?.[size]?.url || thumb.url || null;
}

export default async function Medias() {
  const payload = await getPayloadClient();

  const mediaItems = await payload.find({
    collection: 'media-items' as any,
    sort: 'order' as any,
    limit: 50,
    depth: 1,
  });

  const allItems = mediaItems.docs as any[];
  const videoItems = allItems.filter((m) => m.type === 'video');
  const audioItems = allItems.filter((m) => m.type === 'audio');
  const photoItems = allItems.filter((m) => m.type === 'photo');

  // Miniature : celle uploadée en priorité, sinon dérivée du lien YouTube/Vimeo.
  const videoCards = await Promise.all(
    videoItems.map(async (item: any) => {
      const info = parseVideoUrl(item.url);
      let poster = uploadUrl(item.thumbnail, 'card');
      let posterFallback: string | null = null;
      if (!poster && info) {
        if (info.provider === 'youtube') {
          poster = info.thumbnailUrl;
          posterFallback = info.thumbnailFallbackUrl;
        } else {
          poster = await resolveVimeoThumbnail(item.url);
        }
      }
      return { item, info, poster, posterFallback };
    }),
  );

  const videos = (
    <div className="media-grid">
      {videoCards.map(({ item, info, poster, posterFallback }, i: number) => (
        <FadeIn className="media-card" key={item.id || i}>
          <VideoCard
            title={item.title}
            description={item.description}
            date={item.date}
            href={item.url}
            embedUrl={info?.embedUrl}
            poster={poster}
            posterFallback={posterFallback}
            posterAlt={item.thumbnail?.alt}
          />
        </FadeIn>
      ))}
    </div>
  );

  const audio = (
    <div className="media-grid">
      {audioItems.map((item: any, i: number) => {
        const img = uploadUrl(item.thumbnail, 'card');
        return (
          <FadeIn className="media-card" key={item.id || i}>
            <div className="media-thumbnail">
              {img && (
                <Image
                  src={img}
                  alt={item.thumbnail?.alt || item.title}
                  fill
                  sizes="(max-width: 700px) 100vw, 600px"
                  style={{ objectFit: 'cover' }}
                />
              )}
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Écouter : ${item.title}`}
                  style={overlayLink}
                >
                  <MusicIcon />
                </a>
              ) : (
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <MusicIcon />
                </div>
              )}
            </div>
            <div className="media-info">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <p className="media-date">{item.date}</p>
            </div>
          </FadeIn>
        );
      })}
    </div>
  );

  const photos = (
    <div className="gallery-grid">
      {photoItems.map((item: any, i: number) => {
        const img = uploadUrl(item.thumbnail, 'card');
        const alt = item.thumbnail?.alt || item.title;
        return (
          <FadeIn className="gallery-item" key={item.id || i} style={{ position: 'relative' }}>
            {img ? (
              item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Voir la photo : ${item.title}`}
                  style={{ position: 'absolute', inset: 0 }}
                >
                  <Image
                    src={img}
                    alt={alt}
                    fill
                    sizes="(max-width: 700px) 50vw, 300px"
                    style={{ objectFit: 'cover' }}
                  />
                </a>
              ) : (
                <Image
                  src={img}
                  alt={alt}
                  fill
                  sizes="(max-width: 700px) 50vw, 300px"
                  style={{ objectFit: 'cover' }}
                />
              )
            ) : (
              <ImagePlaceholder size={40} />
            )}
          </FadeIn>
        );
      })}
    </div>
  );

  return (
    <>
      <RefreshOnSave />
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> / Médias
          </p>
          <h1>Médias</h1>
          <p>
            Retrouvez nos vidéos de concerts, nos enregistrements et notre galerie
            photographique.
          </p>
        </div>
      </div>

      {/* MEDIA CONTENT */}
      <section style={{ background: 'var(--color-bg)' }}>
        <div className="container">
          <MediaTabs videos={videos} audio={audio} photos={photos} />
        </div>
      </section>
    </>
  );
}
