'use client';

import Link from 'next/link';
import { useLiveGlobal } from '@/hooks/useLiveDocument';
import { LogoSvg } from './LogoSvg';
import { socialLinksOf, type SocialSettings } from './SocialIcons';
import { renderInline } from '@/lib/richText';

interface FooterProps {
  settings?: {
    description?: string;
    contact?: {
      email?: string;
      phone?: string;
      address?: string;
    };
    social?: SocialSettings;
  };
}

/** Toutes les pages du site, même celles que le menu principal ne montre pas. */
const SITE_LINKS = [
  { href: '/concerts', label: 'Concerts' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/directeur-artistique', label: 'Direction' },
  { href: '/musiciens', label: 'Musiciens' },
  { href: '/medias', label: 'Médias' },
  { href: '/blog', label: 'Blog' },
  { href: '/nous-soutenir', label: 'Nous soutenir' },
  { href: '/contact', label: 'Contact' },
];

export function Footer({ settings: initialSettings }: FooterProps) {
  // Aperçu en direct des « Réglages du site » (description, coordonnées, réseaux).
  const live = useLiveGlobal<Record<string, any> | null>('site-settings', null, 0);
  const settings = live
    ? { description: live.footerDescription, contact: live.contact, social: live.social }
    : initialSettings;
  const description =
    settings?.description ||
    "La Chambre Symphonique est un orchestre fondé en 2017 par Loïc Emmelin, rassemblant plus de 80 musiciens autour de la passion du répertoire symphonique.";
  const email: string = settings?.contact?.email || 'contact@lachambresymphonique.fr';
  const phone: string = settings?.contact?.phone || '';
  const address: string = settings?.contact?.address || 'Bourgogne — Rhône-Alpes\nFrance';
  const socialLinks = socialLinksOf(settings?.social);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <Link href="/" className="logo" aria-label="La Chambre Symphonique — Orchestre, accueil">
              <LogoSvg />
            </Link>
            <p>{renderInline(description)}</p>
            {socialLinks.length > 0 && (
              <div className="footer-social">
                {socialLinks.map(({ key, label, href, Icon }) => (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                    <Icon />
                  </a>
                ))}
              </div>
            )}
          </div>

          <nav aria-label="Toutes les pages">
            <h4>Le site</h4>
            <div className="footer-links footer-links--pages">
              {SITE_LINKS.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          <div>
            <h4>Contact</h4>
            <div className="footer-links">
              <a href={`mailto:${email}`}>{email}</a>
              {phone && <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>}
              <p className="footer-address">
                {address.split('\n').map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} La Chambre Symphonique. Tous droits réservés.</p>
          <button type="button" className="footer-top" onClick={() => window.scrollTo({ top: 0 })}>
            Haut de page <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
