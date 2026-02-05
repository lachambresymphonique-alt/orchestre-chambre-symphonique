'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useLivePreview } from '@payloadcms/live-preview-react';
import { FadeIn } from '@/components/FadeIn';
import { ImagePlaceholder } from '@/components/PlaceholderIcon';
import { NewsletterForm } from '@/components/NewsletterForm';

interface HomeClientProps {
  initialData: any;
  concerts: any[];
  partners: any[];
}

export function HomeClient({ initialData, concerts, partners }: HomeClientProps) {
  const serverURL = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL || '');

  const { data } = useLivePreview({
    initialData,
    serverURL,
    depth: 2,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.self !== window.top) {
      document.body.classList.add('live-preview-mode');
      return () => document.body.classList.remove('live-preview-mode');
    }
  }, []);

  const hero = data.hero;
  const presentation = data.presentation;
  const newsletter = data.newsletter;

  return (
    <>
      {/* HERO */}
      <div data-live-field="hero">
        <section className="hero">
          <div className="hero-bg"></div>
          <div className="hero-content">
            <p className="section-subtitle">{hero?.subtitle}</p>
            <h1>
              {hero?.titleLine1}
              <br />
              <em>{hero?.titleLine2Italic}</em>
            </h1>
            <p>{hero?.description}</p>
            <div className="hero-buttons">
              <a href={hero?.ctaPrimaryLink || '#concerts'} className="btn btn-primary">
                {hero?.ctaPrimaryText || 'Prochains concerts'}
              </a>
              <Link href={hero?.ctaSecondaryLink || '/a-propos'} className="btn btn-outline-light">
                {hero?.ctaSecondaryText || "Découvrir l'orchestre"}
              </Link>
            </div>
          </div>
          <div className="scroll-indicator">
            <span>Défiler</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
        </section>
      </div>

      {/* PROCHAINS CONCERTS */}
      <section className="concerts" id="concerts">
        <div className="container">
          <p className="section-subtitle">Agenda</p>
          <h2 className="section-title">Prochains concerts</h2>

          <div className="concerts-grid">
            {concerts.map((concert: any, index: number) => (
              <FadeIn className="concert-card" key={concert.id || index}>
                <div className="concert-date">
                  <span className="day">{concert.day}</span>
                  <div>
                    <span className="month-year">{concert.monthYear}</span>
                  </div>
                </div>
                <h3>{concert.title}</h3>
                <p className="venue">{concert.venue}</p>
                <p className="program">{concert.program}</p>
                <a href={concert.bookingLink || '#'} className="btn btn-outline">
                  Réserver
                </a>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PRÉSENTATION */}
      <div data-live-field="presentation">
        <section className="presentation">
          <div className="container">
            <div className="presentation-content">
              <div className="presentation-image">
                <ImagePlaceholder size={80} />
              </div>
              <FadeIn className="presentation-text">
                <p className="section-subtitle">{presentation?.subtitle}</p>
                <h2>{presentation?.title}</h2>
                {presentation?.paragraphs
                  ?.split('\n\n')
                  .map((p: string, i: number) => <p key={i}>{p}</p>)}
                <Link href={presentation?.ctaLink || '/a-propos'} className="btn btn-dark">
                  {presentation?.ctaText || 'En savoir plus'}
                </Link>
                {presentation?.signature && (
                  <p className="signature">— {presentation.signature}</p>
                )}
              </FadeIn>
            </div>
          </div>
        </section>
      </div>

      {/* PARTENAIRES */}
      <section className="partners">
        <div className="container">
          <p className="section-subtitle">Ils nous font confiance</p>
          <h2 className="section-title">Nos partenaires</h2>

          <div className="partners-grid">
            {partners.map((partner: any, i: number) => (
              <FadeIn className="partner-logo" key={partner.id || i}>
                <span>{partner.name}</span>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <div data-live-field="newsletter">
        <section className="newsletter">
          <div className="container">
            <p className="section-subtitle">{newsletter?.subtitle}</p>
            <h2 className="section-title">{newsletter?.title}</h2>
            <p>{newsletter?.description}</p>
            <NewsletterForm />
          </div>
        </section>
      </div>
    </>
  );
}
