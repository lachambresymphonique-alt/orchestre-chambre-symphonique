import Link from 'next/link';
import { LogoSvg } from './LogoSvg';
import { FacebookIcon, InstagramIcon, YouTubeIcon, LinkedInIcon, TikTokIcon } from './SocialIcons';

interface FooterProps {
  settings?: {
    description?: string;
    contact?: {
      email?: string;
      phone?: string;
      address?: string;
    };
  };
}

export function Footer({ settings }: FooterProps) {
  const description =
    settings?.description ||
    "L'Orchestre de la Chambre Symphonique est un ensemble musical d'excellence dédié à la musique de chambre et symphonique.";
  const email = settings?.contact?.email || 'contact@chambre-symphonique.fr';
  const phone = settings?.contact?.phone || '+33 1 42 00 00 00';
  const address = settings?.contact?.address || '12 Rue de la Musique\n75008 Paris, France';

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <Link href="/" className="logo">
              <div className="logo-icon">
                <LogoSvg color="#E8D48B" />
              </div>
              <div className="logo-text">
                <span className="name">Chambre Symphonique</span>
                <span className="subtitle">Orchestre</span>
              </div>
            </Link>
            <p>{description}</p>
            <div className="footer-social">
              <a href="#" aria-label="Facebook"><FacebookIcon /></a>
              <a href="#" aria-label="Instagram"><InstagramIcon /></a>
              <a href="#" aria-label="YouTube"><YouTubeIcon /></a>
              <a href="#" aria-label="LinkedIn"><LinkedInIcon /></a>
              <a href="#" aria-label="TikTok"><TikTokIcon /></a>
            </div>
          </div>

          <div>
            <h4>Navigation</h4>
            <div className="footer-links">
              <Link href="/">Accueil</Link>
              <Link href="/a-propos">À propos</Link>
              <Link href="/musiciens">Musiciens</Link>
              <Link href="/medias">Médias</Link>
              <Link href="/nous-soutenir">Nous soutenir</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>

          <div>
            <h4>Informations</h4>
            <div className="footer-links">
              <a href="#">Billetterie</a>
              <a href="#">Espace presse</a>
              <a href="#">Programmateurs</a>
              <a href="#">Mentions légales</a>
              <a href="#">Politique de confidentialité</a>
            </div>
          </div>

          <div>
            <h4>Contact</h4>
            <div className="footer-links">
              <a href={`mailto:${email}`}>{email}</a>
              <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
              <a href="#" dangerouslySetInnerHTML={{ __html: address.replace(/\n/g, '<br />') }} />
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Orchestre de la Chambre Symphonique. Tous droits réservés.</p>
          <a href="#">Mentions légales</a>
        </div>
      </div>
    </footer>
  );
}
