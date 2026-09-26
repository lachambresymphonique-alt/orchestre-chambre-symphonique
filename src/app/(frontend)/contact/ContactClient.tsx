'use client';

import Link from 'next/link';
import { useLiveGlobal } from '@/hooks/useLiveDocument';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { FadeIn } from '@/components/FadeIn';
import { ContactForm } from '@/components/ContactForm';
import { RefreshOnSave } from '@/components/RefreshOnSave';
import { FacebookIcon, InstagramIcon, YouTubeIcon, LinkedInIcon, TikTokIcon } from '@/components/SocialIcons';
import { renderInline } from '@/lib/richText';

interface ContactClientProps {
  /** Réglages du site (coordonnées, horaires, réseaux) — aperçu en direct. */
  initialData: any;
  /** Textes de la page (Pages → Page Contact). */
  pageContent?: any;
  /** Jeton anti-robot signé côté serveur, transmis au formulaire. */
  formToken: string;
  /** Clé publique Cloudflare Turnstile, ou `null` si le captcha n'est pas configuré. */
  turnstileSiteKey: string | null;
}

const SOCIAL_NETWORKS = [
  { key: 'facebook', label: 'Facebook', Icon: FacebookIcon },
  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { key: 'youtube', label: 'YouTube', Icon: YouTubeIcon },
  { key: 'linkedin', label: 'LinkedIn', Icon: LinkedInIcon },
  { key: 'tiktok', label: 'TikTok', Icon: TikTokIcon },
] as const;

export function ContactClient({ initialData, pageContent, formToken, turnstileSiteKey }: ContactClientProps) {
  // Aperçu en direct : les deux pages globales montrées ici (Réglages du site et
  // Page Contact) ; chacune ne se met à jour qu'avec sa propre fiche.
  const data = useLiveGlobal('site-settings', initialData, 0);
  const liveContent = useLiveGlobal('contact-page', pageContent, 0);

  useLivePreviewSync(data);

  const contact = data.contact || {};
  const hours = data.hours || [];
  const social = data.social || {};
  const socialLinks = SOCIAL_NETWORKS.filter((n) => typeof social[n.key] === 'string' && social[n.key].trim());
  // Page texts are editable in Pages → Page Contact; strings are defaults.
  const header = liveContent?.header || {};
  const info = liveContent?.info || {};

  return (
    <>
      <RefreshOnSave />
      <div className="page-header" data-live-field="header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> / Contact
          </p>
          <h1>{header.title || 'Contactez-nous'}</h1>
          <p>
            {renderInline(
              header.lede ||
                'Une question, une demande de partenariat ou de réservation ? N\u2019hésitez pas à nous écrire.',
            )}
          </p>
        </div>
      </div>

      <section className="contact-section">
        <div className="contact-grid">
            <ContactForm formToken={formToken} turnstileSiteKey={turnstileSiteKey} copy={liveContent?.form} />

            <FadeIn>
              <div className="contact-info-block" data-live-field="contact" data-live-owner="/admin/globals/site-settings">
                <h3>{info.coordinatesTitle || 'Coordonnées'}</h3>
                <div className="contact-detail">
                  <div className="icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <p dangerouslySetInnerHTML={{ __html: (contact.address || '').replace(/\n/g, '<br />') }} />
                </div>
                <div className="contact-detail">
                  <div className="icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <p>
                    <a href={`mailto:${contact.email}`}>
                      {contact.email}
                    </a>
                  </p>
                </div>
                <div className="contact-detail">
                  <div className="icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </div>
                  <p>
                    <a href={`tel:${contact.phone?.replace(/\s/g, '')}`}>{contact.phone}</a>
                  </p>
                </div>
              </div>

              <div className="contact-info-block" data-live-field="hours" data-live-owner="/admin/globals/site-settings">
                <h3>{info.hoursTitle || 'Horaires d\u2019ouverture'}</h3>
                <div className="contact-detail">
                  <div className="icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    {hours.map((h: any, i: number) => (
                      <p key={i}>{h.label} : {h.hours}</p>
                    ))}
                  </div>
                </div>
              </div>

              {socialLinks.length > 0 && (
                <div className="contact-info-block" data-live-field="social" data-live-owner="/admin/globals/site-settings">
                  <h3>{info.socialTitle || 'Suivez-nous'}</h3>
                  <div className="footer-social" style={{ marginTop: 0 }}>
                    {socialLinks.map(({ key, label, Icon }) => (
                      <a
                        key={key}
                        href={social[key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        style={{
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-gold-dark)',
                        }}
                      >
                        <Icon />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </FadeIn>
          </div>
      </section>
    </>
  );
}
