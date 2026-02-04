'use client';

import { useState, ReactNode } from 'react';

interface MediaTabsProps {
  videos: ReactNode;
  audio: ReactNode;
  photos: ReactNode;
}

const tabs = [
  { key: 'all', label: 'Tout' },
  { key: 'videos', label: 'Vidéos' },
  { key: 'audio', label: 'Enregistrements' },
  { key: 'photos', label: 'Photos' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

export function MediaTabs({ videos, audio, photos }: MediaTabsProps) {
  const [active, setActive] = useState<TabKey>('all');

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
          <div className="section-divider"><h3>Vidéos</h3></div>
          {videos}
        </div>
      )}

      {(active === 'all' || active === 'audio') && (
        <div style={{ marginBottom: '3rem' }}>
          <div className="section-divider"><h3>Enregistrements</h3></div>
          {audio}
        </div>
      )}

      {(active === 'all' || active === 'photos') && (
        <div>
          <div className="section-divider"><h3>Galerie photos</h3></div>
          {photos}
        </div>
      )}
    </>
  );
}
