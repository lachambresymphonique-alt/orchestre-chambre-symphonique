import type { Metadata } from 'next';
import Link from 'next/link';
import { FadeIn } from '@/components/FadeIn';
import { ImagePlaceholder } from '@/components/PlaceholderIcon';
import { getPayloadClient } from '@/lib/payload';

export const metadata: Metadata = {
  title: 'À propos — Orchestre de la Chambre Symphonique',
  description:
    "Découvrez l'histoire, la mission et les valeurs de l'Orchestre de la Chambre Symphonique.",
};

export default async function APropos() {
  const payload = await getPayloadClient();

  const [aboutPage, timelineEvents] = await Promise.all([
    payload.findGlobal({ slug: 'about-page' as any }),
    payload.find({ collection: 'timeline-events' as any }),
  ]);

  const intro = (aboutPage as any).intro;
  const stats = (aboutPage as any).stats || [];

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
            Une aventure musicale collective portée par la passion, l&apos;exigence et
            le partage.
          </p>
        </div>
      </div>

      {/* ABOUT INTRO */}
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

      {/* CHIFFRES CLÉS */}
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

      {/* HISTORIQUE */}
      <section className="history-section">
        <div className="container">
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            Notre parcours
          </p>
          <h2 className="section-title">Les grandes dates</h2>

          <div className="timeline">
            {(timelineEvents.docs as any[]).map((item: any) => (
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
