'use client';

import { useState, ReactNode } from 'react';

export type MediaTabLabels = {
  allLabel?: string | null;
  videosLabel?: string | null;
  audioLabel?: string | null;
  photosLabel?: string | null;
  galleryTitle?: string | null;
};

interface MediaTabsProps {
  /** `null` : rubrique vide, sans onglet ni intertitre. */
  videos: ReactNode | null;
  audio: ReactNode | null;
  photos: ReactNode | null;
  /** Labels editable in Pages → Page Médias; defaults below. */
  labels?: MediaTabLabels | null;
}

type TabKey = 'all' | 'videos' | 'audio' | 'photos';

export function MediaTabs({ videos, audio, photos, labels }: MediaTabsProps) {
  const [active, setActive] = useState<TabKey>('all');
  const l = {
    all: labels?.allLabel || 'Tout',
    videos: labels?.videosLabel || 'Vidéos',
    audio: labels?.audioLabel || 'Enregistrements',
    photos: labels?.photosLabel || 'Photos',
    gallery: labels?.galleryTitle || 'Galerie photos',
  };
  const sections = [
    { key: 'videos', label: l.videos, content: videos },
    { key: 'audio', label: l.audio, content: audio },
    { key: 'photos', label: l.photos, content: photos },
  ].filter((t) => t.content !== null) as { key: TabKey; label: string }[];
  // Des onglets seulement s'il y a de quoi choisir.
  const tabs = sections.length > 1 ? [{ key: 'all' as TabKey, label: l.all }, ...sections] : [];
  const shows = (key: TabKey) => active === 'all' || active === key;

  return (
    <>
      {tabs.length > 0 && (
        <div className="media-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`media-tab${active === tab.key ? ' active' : ''}`}
              aria-pressed={active === tab.key}
              onClick={() => setActive(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {videos !== null && shows('videos') && (
        <div style={{ marginBottom: '3rem' }}>
          <div className="section-divider"><h3>{l.videos}</h3></div>
          {videos}
        </div>
      )}

      {audio !== null && shows('audio') && (
        <div style={{ marginBottom: '3rem' }}>
          <div className="section-divider"><h3>{l.audio}</h3></div>
          {audio}
        </div>
      )}

      {photos !== null && shows('photos') && (
        <div>
          <div className="section-divider"><h3>{l.gallery}</h3></div>
          {photos}
        </div>
      )}
    </>
  );
}
