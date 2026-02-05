'use client';

import Link from 'next/link';
import { useLivePreview } from '@payloadcms/live-preview-react';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { FadeIn } from '@/components/FadeIn';
import { ImagePlaceholder } from '@/components/PlaceholderIcon';

interface AboutClientProps {
  initialData: any;
  timelineEvents: any[];
}

export function AboutClient({ initialData, timelineEvents }: AboutClientProps) {
  const serverURL = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL || '');

  const { data } = useLivePreview({
    initialData,
    serverURL,
    depth: 0,
  });

  useLivePreviewSync(data);

  const intro = data.intro;
  const stats = data.stats || [];

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> / À propos
          </p>
          <h1>À propos de l&apos;orchestre</h1>
          <p>
            Un orchestre fondé en 2017 par Loïc Emmelin, porté par la passion
            et l&apos;ambition du répertoire symphonique.
          </p>
        </div>
      </div>

      {/* ABOUT INTRO */}
      <div data-live-field="intro">
        <section className="about-intro">
          <div className="container">
            <div className="about-content">
              <FadeIn>
                <p className="section-subtitle">{intro?.subtitle}</p>
                <h2>{intro?.title}</h2>
                {intro?.content
                  ?.split('\n\n')
                  .map((p: string, i: number) => <p key={i}>{p}</p>)}
              </FadeIn>
              <div className="about-image">
                <ImagePlaceholder size={80} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* CHIFFRES CLÉS */}
      <div data-live-field="stats">
        <section style={{ background: 'var(--color-bg-alt)' }}>
          <div className="container">
            <p className="section-subtitle" style={{ textAlign: 'center' }}>
              En quelques chiffres
            </p>
            <h2 className="section-title">L&apos;orchestre en chiffres</h2>
            <div className="stats-grid">
              {stats.map((stat: any, i: number) => (
                <FadeIn className="stat-item" key={i}>
                  <span className="number">{stat.number}</span>
                  <span className="label">{stat.label}</span>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* HISTORIQUE */}
      <section className="history-section">
        <div className="container">
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            Notre parcours
          </p>
          <h2 className="section-title">Les grandes dates</h2>

          <div className="timeline">
            {timelineEvents.map((item: any) => (
              <FadeIn className="timeline-item" key={item.id || item.year}>
                <div className="year">{item.year}</div>
                <p>{item.description}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
