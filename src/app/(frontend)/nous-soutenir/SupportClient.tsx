'use client';

import Link from 'next/link';
import { useLivePreview } from '@payloadcms/live-preview-react';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { FadeIn } from '@/components/FadeIn';

interface SupportClientProps {
  initialData: any;
  tiers: any[];
}

export function SupportClient({ initialData, tiers }: SupportClientProps) {
  const serverURL = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL || '');

  const { data } = useLivePreview({
    initialData,
    serverURL,
    depth: 2,
  });

  useLivePreviewSync(data);

  const supportTypes = data.supportTypes || [];
  const taxInfo = data.taxInfo;

  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> / Nous soutenir
          </p>
          <h1>Nous soutenir</h1>
          <p>
            Votre soutien est essentiel pour faire vivre la musique et la rendre
            accessible à tous.
          </p>
        </div>
      </div>

      <section style={{ background: 'var(--color-bg)' }} data-live-field="supportTypes">
        <div className="container">
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            Comment nous aider
          </p>
          <h2 className="section-title">Les formes de soutien</h2>

          <div className="support-options">
            {supportTypes.map((st: any, i: number) => (
              <FadeIn className="support-card" key={i}>
                <h3>{st.title}</h3>
                <p>{st.description}</p>
                {st.ctaLink && (
                  <Link href={st.ctaLink} className="btn btn-primary">
                    {st.ctaText || 'En savoir plus'}
                  </Link>
                )}
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {taxInfo && (
        <section className="tax-info" data-live-field="taxInfo">
          <FadeIn className="container">
            <p className="section-subtitle">{taxInfo.subtitle}</p>
            <h2 className="section-title">{taxInfo.title}</h2>
            <p
              style={{
                maxWidth: '600px',
                margin: '0 auto 2rem',
                color: 'var(--color-text-light)',
                fontWeight: 300,
              }}
            >
              {taxInfo.description}
            </p>
            <div className="stats-grid" style={{ maxWidth: '600px', margin: '0 auto' }}>
              {taxInfo.individualRate && (
                <div className="stat-item">
                  <span className="highlight">{taxInfo.individualRate}</span>
                  <span className="label">Particuliers</span>
                </div>
              )}
              {taxInfo.corporateRate && (
                <div className="stat-item">
                  <span className="highlight">{taxInfo.corporateRate}</span>
                  <span className="label">Entreprises</span>
                </div>
              )}
            </div>
            {taxInfo.example && (
              <p
                style={{
                  maxWidth: '500px',
                  margin: '2rem auto 0',
                  fontSize: '0.85rem',
                  color: 'var(--color-text-light)',
                  fontWeight: 300,
                }}
              >
                {taxInfo.example}
              </p>
            )}
          </FadeIn>
        </section>
      )}

      <section style={{ background: 'var(--color-bg)' }}>
        <div className="container">
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            Cercle des mécènes
          </p>
          <h2 className="section-title">Nos cercles de soutien</h2>

          <div className="support-options">
            {tiers.map((tier: any, i: number) => (
              <FadeIn
                className="support-card"
                key={tier.id || i}
                style={tier.highlighted ? { borderColor: 'var(--color-gold)' } : undefined}
              >
                <h3>{tier.name}</h3>
                {tier.minAmount && (
                  <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                    À partir de {tier.minAmount} € par an
                  </p>
                )}
                <p>{tier.description}</p>
                {tier.ctaLink && (
                  <a
                    href={tier.ctaLink}
                    className={tier.highlighted ? 'btn btn-primary' : 'btn btn-outline'}
                  >
                    {tier.ctaText || 'Rejoindre'}
                  </a>
                )}
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
