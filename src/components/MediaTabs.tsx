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
  videos: ReactNode;
  audio: ReactNode;
  photos: ReactNode;
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
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: l.all },
    { key: 'videos', label: l.videos },
    { key: 'audio', label: l.audio },
    { key: 'photos', label: l.photos },
  ];

  return (
    <>
      <div className="media-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`media-tab${active === tab.key ? ' active' : ''}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(active === 'all' || active === 'videos') && (
        <div style={{ marginBottom: '3rem' }}>
          <div className="section-divider"><h3>{l.videos}</h3></div>
          {videos}
        </div>
      )}

      {(active === 'all' || active === 'audio') && (
        <div style={{ marginBottom: '3rem' }}>
          <div className="section-divider"><h3>{l.audio}</h3></div>
          {audio}
        </div>
      )}

      {(active === 'all' || active === 'photos') && (
        <div>
          <div className="section-divider"><h3>{l.gallery}</h3></div>
          {photos}
        </div>
      )}
    </>
  );
}
