'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useLivePreview } from '@payloadcms/live-preview-react';
import { FadeIn } from '@/components/FadeIn';
import { ContactForm } from '@/components/ContactForm';
import { FacebookIcon, InstagramIcon, YouTubeIcon, LinkedInIcon } from '@/components/SocialIcons';

interface ContactClientProps {
  initialData: any;
}

export function ContactClient({ initialData }: ContactClientProps) {
  const { data } = useLivePreview({
    initialData,
    serverURL: process.env.NEXT_PUBLIC_SITE_URL || '',
    depth: 2,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.self !== window.top) {
      document.body.classList.add('live-preview-mode');
      return () => document.body.classList.remove('live-preview-mode');
    }
  }, []);

  const contact = data.contact || {};
  const hours = data.hours || [];

  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> / Contact
          </p>
          <h1>Contactez-nous</h1>
          <p>
            Une question, une demande de partenariat ou de réservation ?
            N&apos;hésitez pas à nous écrire.
          </p>
        </div>
      </div>

      <section style={{ background: 'var(--color-bg)' }}>
        <div className="container">
          <div className="contact-grid">
            <ContactForm />

            <FadeIn>
              <div className="contact-info-block" data-live-field="contact">
                <h3>Coordonnées</h3>
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

              <div className="contact-info-block" data-live-field="hours">
                <h3>Horaires d&apos;ouverture</h3>
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

              <div className="contact-info-block">
                <h3>Suivez-nous</h3>
                <div
                  className="footer-social"
                  style={{ marginTop: 0 }}
                >
                  <a
                    href="#"
                    aria-label="Facebook"
                    style={{
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-gold-dark)',
                    }}
                  >
                    <FacebookIcon />
                  </a>
                  <a
                    href="#"
                    aria-label="Instagram"
                    style={{
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-gold-dark)',
                    }}
                  >
                    <InstagramIcon />
                  </a>
                  <a
                    href="#"
                    aria-label="YouTube"
                    style={{
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-gold-dark)',
                    }}
                  >
                    <YouTubeIcon />
                  </a>
                  <a
                    href="#"
                    aria-label="LinkedIn"
                    style={{
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-gold-dark)',
                    }}
                  >
                    <LinkedInIcon />
                  </a>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
