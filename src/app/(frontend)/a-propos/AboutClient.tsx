'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLiveGlobal, useLiveList } from '@/hooks/useLiveDocument';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { FadeIn } from '@/components/FadeIn';
import { stockImages } from '@/lib/unsplash';
import { renderEmphasis } from '@/lib/emphasis';

interface AboutClientProps {
  initialData: any;
  timelineEvents: any[];
}

export function AboutClient({ initialData, timelineEvents }: AboutClientProps) {
  // Aperçu en direct : la page « À propos » et les événements de la chronologie.
  const data = useLiveGlobal('about-page', initialData, 1);
  const events = useLiveList('timeline-events', timelineEvents);

  useLivePreviewSync(data);

  const intro = data.intro;
  const stats = data.stats || [];
  // Titles below are editable in Pages → Page À propos; strings are defaults.
  const header = data.header || {};
  const timeline = data.timeline || {};

  const introParas = (intro?.content || '').split('\n\n').filter(Boolean);

  return (
    <div className="about-page">
      {/* PAGE HEADER */}
      <div className="page-header" data-live-field="header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> &nbsp;/&nbsp; À propos
          </p>
          <h1>{header.title || 'L\'orchestre'}</h1>
          <p>
            {header.lede ||
              'Un orchestre fondé en 2017 par Loïc Emmelin, porté par l\'ambition du répertoire symphonique en effectif resserré.'}
          </p>
        </div>
      </div>

      {/* INTRO — editorial split */}
      <div data-live-field="intro">
        <section className="about-intro">
          <div className="about-intro__inner">
            <FadeIn className="about-intro__media">
              <Image
                src={intro?.image?.url || stockImages.conductor}
                alt={intro?.image?.alt || "Photo de l'orchestre"}
                width={900}
                height={1100}
                sizes="(max-width: 900px) 100vw, 45vw"
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              />
            </FadeIn>

            <FadeIn className="about-intro__text">
              <p className="eyebrow eyebrow--gold">{intro?.subtitle || 'Notre histoire'}</p>
              <h2 className="about-intro__title">{intro?.title}</h2>
              <hr className="velvet-rule" />
              <div className="about-intro__prose">
                {introParas.map((p: string, i: number) => (
                  <p key={i} data-lead={i === 0 ? 'true' : undefined}>{p}</p>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>
      </div>

      {/* STATS — simplified inline ribbon */}
      {stats.length > 0 && (
        <div data-live-field="stats">
          <section className="about-stats">
            <ul className="about-stats__list">
              {stats.map((stat: any, i: number) => (
                <FadeIn key={i}>
                  <li>
                    <span className="about-stats__number">{stat.number}</span>
                    <span className="about-stats__label">{stat.label}</span>
                  </li>
                </FadeIn>
              ))}
            </ul>
          </section>
        </div>
      )}

      {/* TIMELINE — editorial */}
      {events.length > 0 && (
        <section className="about-timeline" data-live-field="timeline">
          <header className="about-timeline__head">
            <p className="eyebrow eyebrow--gold">{timeline.eyebrow || 'Le parcours'}</p>
            <h2 className="about-timeline__title">
              {renderEmphasis(timeline.title || '*Les grandes dates*')}
            </h2>
            <hr className="velvet-rule" />
          </header>

          <ol className="timeline-editorial">
            {events.map((item: any) => (
              <FadeIn key={item.id || item.year}>
                <li
                  className="timeline-editorial__item"
                  data-live-link={item.id ? `/admin/collections/timeline-events/${item.id}` : undefined}
                >
                  <span className="timeline-editorial__year" data-live-item-field="year">{item.year}</span>
                  <p className="timeline-editorial__desc" data-live-item-field="description">{item.description}</p>
                </li>
              </FadeIn>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
