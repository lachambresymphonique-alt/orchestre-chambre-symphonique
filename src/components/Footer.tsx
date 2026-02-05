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
    "La Chambre Symphonique est un orchestre fondé en 2017 par Loïc Emmelin, rassemblant plus de 80 musiciens autour de la passion du répertoire symphonique.";
  const email = settings?.contact?.email || 'contact@lachambresymphonique.fr';
  const phone = settings?.contact?.phone || '';
  const address = settings?.contact?.address || 'Bourgogne — Rhône-Alpes\nFrance';

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
                <span className="name">La Chambre Symphonique</span>
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
              {phone && <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>}
              <a href="#" dangerouslySetInnerHTML={{ __html: address.replace(/\n/g, '<br />') }} />
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 La Chambre Symphonique. Tous droits réservés.</p>
          <a href="#">Mentions légales</a>
        </div>
      </div>
    </footer>
  );
}
