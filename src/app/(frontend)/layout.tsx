import type { Metadata } from 'next';
import { Bodoni_Moda, Fraunces, Ibarra_Real_Nova, Inter, Source_Serif_4 } from 'next/font/google';
import Script from 'next/script';
import '../globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getPayloadClient } from '@/lib/payload';
import { legacyNavItems, resolveNavItems, type NavLink } from '@/lib/navigation';

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['SOFT', 'opsz'],
  display: 'swap',
});

// Polices de titres proposées dans « Réglages → Apparence du site ». Le
// navigateur ne télécharge que celle qui est réellement utilisée.
const ibarra = Ibarra_Real_Nova({
  variable: '--font-ibarra',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const bodoni = Bodoni_Moda({
  variable: '--font-bodoni',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  variable: '--font-source-serif',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

const SITE_URL = 'https://www.lachambresymphonique.fr';
const SITE_DESCRIPTION =
  'La Chambre Symphonique, orchestre fondé en 2017 par Loïc Emmelin. Plus de 80 musiciens réunis par la passion du répertoire symphonique en Bourgogne et Rhône-Alpes.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'La Chambre Symphonique — Orchestre',
  description: SITE_DESCRIPTION,
  applicationName: 'La Chambre Symphonique',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'La Chambre Symphonique',
    title: 'La Chambre Symphonique — Orchestre',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La Chambre Symphonique — Orchestre',
    description: SITE_DESCRIPTION,
  },
};

export const dynamic = 'force-dynamic';

/** Valeurs acceptées pour la typographie des titres (voir globals.css). */
const DISPLAY_FONTS = ['fraunces-soft', 'fraunces-sharp', 'ibarra', 'bodoni'] as const;
type DisplayFont = (typeof DISPLAY_FONTS)[number];

/** Typographie choisie dans l'admin ; le dessin d'origine par défaut. */
async function getDisplayFont(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
): Promise<DisplayFont> {
  try {
    const theme = await payload.findGlobal({ slug: 'theme-settings' as any });
    const chosen = (theme as any)?.displayFont;
    if (DISPLAY_FONTS.includes(chosen)) return chosen;
  } catch {
    // Réglage absent (schéma pas encore poussé) : dessin d'origine.
  }
  return 'fraunces-soft';
}

/** Menu principal : composé dans l'admin (Réglages → Menu du site), sinon menu historique. */
async function getNavItems(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
): Promise<NavLink[]> {
  try {
    const navigation = await payload.findGlobal({
      slug: 'navigation' as any,
      depth: 1,
      // Seuls ces champs de la page liée sont nécessaires (pas son contenu).
      populate: { pages: { slug: true, title: true, _status: true } } as any,
    });
    const items = resolveNavItems(navigation as any);
    if (items.length > 0) return items;
  } catch {
    // Table du menu absente (schéma pas encore poussé) : menu historique ci-dessous.
  }

  // Menu historique tant que « Réglages → Menu du site » n'est pas configuré :
  // pages fixes + pages de l'admin cochées « Afficher dans la navigation ».
  try {
    const navPages = await payload.find({
      collection: 'pages' as any,
      where: { showInNav: { equals: true }, _status: { equals: 'published' } },
      sort: 'navOrder',
      limit: 20,
      depth: 0,
    });
    return legacyNavItems(navPages.docs as any[]);
  } catch {
    // Pages table may not exist yet — skip gracefully
    return legacyNavItems([]);
  }
}

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const payload = await getPayloadClient();
  const [siteSettings, navItems, displayFont] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings' as any }),
    getNavItems(payload),
    getDisplayFont(payload),
  ]);

  const settings = {
    description: (siteSettings as any).footerDescription,
    contact: (siteSettings as any).contact,
  };

  const fontClasses = [
    fraunces.variable,
    ibarra.variable,
    bodoni.variable,
    inter.variable,
    sourceSerif.variable,
  ].join(' ');

  return (
    // The font variables must live on <html>: the design tokens in globals.css
    // (--font-display, --font-body…) are declared on :root and reference them.
    // Declared on <body> they were undefined at :root, which invalidated the
    // tokens and made the whole site fall back to Times.
    // data-display : typographie des titres choisie dans l'admin.
    <html lang="fr" className={fontClasses} data-display={displayFont}>
      <body>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PEYDBZWKSP"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-PEYDBZWKSP');
          `}
        </Script>
        <Header items={navItems} />
        {children}
        <Footer settings={settings} />
      </body>
    </html>
  );
}
