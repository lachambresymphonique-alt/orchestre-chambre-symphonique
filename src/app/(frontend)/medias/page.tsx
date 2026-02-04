import type { Metadata } from 'next';
import Link from 'next/link';
import { FadeIn } from '@/components/FadeIn';
import { ImagePlaceholder } from '@/components/PlaceholderIcon';
import { MediaTabs } from '@/components/MediaTabs';
import { getPayloadClient } from '@/lib/payload';

export const metadata: Metadata = {
  title: 'Médias — Orchestre de la Chambre Symphonique',
  description:
    "Vidéos, enregistrements et galerie photos de l'Orchestre de la Chambre Symphonique.",
};

function PlayIcon() {
  return (
    <div className="play-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  );
}

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

export default async function Medias() {
  const payload = await getPayloadClient();

  const mediaItems = await payload.find({
    collection: 'media-items' as any,
    sort: 'order' as any,
    limit: 50,
  });

  const allItems = mediaItems.docs as any[];
  const videoItems = allItems.filter((m) => m.type === 'video');
  const audioItems = allItems.filter((m) => m.type === 'audio');
  const photoItems = allItems.filter((m) => m.type === 'photo');

  const videos = (
    <div className="media-grid">
      {videoItems.map((item: any, i: number) => (
        <FadeIn className="media-card" key={item.id || i}>
          <div className="media-thumbnail">
            <PlayIcon />
          </div>
          <div className="media-info">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <p className="media-date">{item.date}</p>
          </div>
        </FadeIn>
      ))}
    </div>
  );

  const audio = (
    <div className="media-grid">
      {audioItems.map((item: any, i: number) => (
        <FadeIn className="media-card" key={item.id || i}>
          <div className="media-thumbnail">
            <MusicIcon />
          </div>
          <div className="media-info">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <p className="media-date">{item.date}</p>
          </div>
        </FadeIn>
      ))}
    </div>
  );

  const photos = (
    <div className="gallery-grid">
      {photoItems.map((item: any, i: number) => (
        <FadeIn className="gallery-item" key={item.id || i}>
          <ImagePlaceholder size={40} />
        </FadeIn>
      ))}
    </div>
  );

  return (
    <>
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
