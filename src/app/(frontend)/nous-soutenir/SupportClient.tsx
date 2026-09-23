'use client';

import Link from 'next/link';
import { useLiveGlobal, useLiveList } from '@/hooks/useLiveDocument';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { FadeIn } from '@/components/FadeIn';
import { DonationSimulator } from '@/components/DonationSimulator';

interface SupportClientProps {
  initialData: any;
  tiers: any[];
}

export function SupportClient({ initialData, tiers }: SupportClientProps) {
  // Aperçu en direct : la page « Nous soutenir » et les cercles de soutien.
  const data = useLiveGlobal('support-page', initialData, 0);
  const liveTiers = useLiveList('support-tiers', tiers);

  useLivePreviewSync(data);

  const supportTypes = data.supportTypes || [];
  const taxInfo = data.taxInfo;
  // Every title below is editable in Pages → Page Nous soutenir; strings are defaults.
  const header = data.header || {};
  const typesHeading = data.supportTypesHeading || {};
  const tiersHeading = data.tiersHeading || {};
  const simulator = data.simulator || {};
  const amountTemplate: string = tiersHeading.amountTemplate || 'À partir de {montant} € par an';

  return (
    <>
      <div className="page-header" data-live-field="header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> / Nous soutenir
          </p>
          <h1>{header.title || 'Nous soutenir'}</h1>
          <p>
            {header.lede ||
              'Votre soutien est essentiel pour faire vivre la musique et la rendre accessible à tous.'}
          </p>
        </div>
      </div>

      <section style={{ background: 'var(--color-bg)' }} data-live-field="supportTypes">
        <div className="container">
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            {typesHeading.subtitle || 'Comment nous aider'}
          </p>
          <h2 className="section-title">{typesHeading.title || 'Les formes de soutien'}</h2>

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
                  <span className="label">{taxInfo.individualLabel || 'Particuliers'}</span>
                </div>
              )}
              {taxInfo.corporateRate && (
                <div className="stat-item">
                  <span className="highlight">{taxInfo.corporateRate}</span>
                  <span className="label">{taxInfo.corporateLabel || 'Entreprises'}</span>
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

      {simulator.enabled !== false && <DonationSimulator config={simulator} />}

      <section style={{ background: 'var(--color-bg)' }} data-live-field="tiersHeading">
        <div className="container">
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            {tiersHeading.subtitle || 'Cercle des mécènes'}
          </p>
          <h2 className="section-title">{tiersHeading.title || 'Nos cercles de soutien'}</h2>

          <div className="support-options">
            {liveTiers.map((tier: any, i: number) => (
              <FadeIn
                className="support-card"
                key={tier.id || i}
                data-live-link={tier.id ? `/admin/collections/support-tiers/${tier.id}` : undefined}
                style={tier.highlighted ? { borderColor: 'var(--color-gold)' } : undefined}
              >
                <h3 data-live-item-field="name">{tier.name}</h3>
                {tier.minAmount && (
                  <p style={{ fontWeight: 500, marginBottom: '0.5rem' }} data-live-item-field="minAmount">
                    {amountTemplate.replace('{montant}', String(tier.minAmount))}
                  </p>
                )}
                <p data-live-item-field="description">{tier.description}</p>
                {tier.ctaLink && (
                  <a
                    href={tier.ctaLink}
                    className={tier.highlighted ? 'btn btn-primary' : 'btn btn-outline'}
                    data-live-item-field="ctaText"
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
