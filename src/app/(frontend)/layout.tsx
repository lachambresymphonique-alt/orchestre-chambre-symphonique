import type { Metadata } from 'next';
import {
  Bodoni_Moda,
  Cormorant_Garamond,
  DM_Sans,
  EB_Garamond,
  Fraunces,
  Ibarra_Real_Nova,
  Inter,
  Josefin_Sans,
  Jost,
  Lato,
  Lora,
  Montserrat,
  Playfair_Display,
  Raleway,
  Source_Serif_4,
} from 'next/font/google';
import Script from 'next/script';
import '../globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageViewTracker } from '@/components/PageViewTracker';
import { ThemeLive } from '@/components/ThemeLive';
import { getPayloadClient } from '@/lib/payload';
import { isNavConfigured, legacyNavItems, resolveNavItems, type NavLink } from '@/lib/navigation';
import { resolveTheme, type ThemeDoc } from '@/lib/theme';

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['SOFT', 'opsz'],
  display: 'swap',
});

// Polices proposées dans « Réglages → Apparence du site » (catalogue :
// src/lib/theme.ts). Sans préchargement : le navigateur ne télécharge que
// celles que le thème utilise réellement.
const ibarra = Ibarra_Real_Nova({
  variable: '--font-ibarra',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
});

const bodoni = Bodoni_Moda({
  variable: '--font-bodoni',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
  preload: false,
});

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500', '600'],
  display: 'swap',
  preload: false,
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
});

const ebGaramond = EB_Garamond({
  variable: '--font-ebgaramond',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
});

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
});

const lato = Lato({
  variable: '--font-lato',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['300', '400', '700'],
  display: 'swap',
  preload: false,
});

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
});

const raleway = Raleway({
  variable: '--font-raleway',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
});

const josefin = Josefin_Sans({
  variable: '--font-josefin',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
});

const jost = Jost({
  variable: '--font-jost',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
});

const dmSans = DM_Sans({
  variable: '--font-dmsans',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
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

/** Apparence choisie dans l'admin (Réglages → Apparence du site) ; le dessin d'origine par défaut. */
async function getTheme(payload: Awaited<ReturnType<typeof getPayloadClient>>): Promise<ThemeDoc | null> {
  try {
    return (await payload.findGlobal({ slug: 'theme-settings' as any })) as ThemeDoc;
  } catch {
    // Réglage absent (schéma pas encore poussé) : dessin d'origine.
    return null;
  }
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
    // Menu composé dans l'admin : on le respecte, même si tout y est masqué.
    if (items.length > 0 || isNavConfigured(navigation as any)) return items;
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
  const [siteSettings, navItems, theme] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings' as any }),
    getNavItems(payload),
    getTheme(payload),
  ]);

  const settings = {
    description: (siteSettings as any).footerDescription,
    contact: (siteSettings as any).contact,
  };

  const { vars: themeVars, attrs } = resolveTheme(theme);

  const fontClasses = [
    fraunces.variable,
    ibarra.variable,
    bodoni.variable,
    cormorant.variable,
    playfair.variable,
    ebGaramond.variable,
    lora.variable,
    dmSans.variable,
    lato.variable,
    montserrat.variable,
    raleway.variable,
    josefin.variable,
    jost.variable,
    inter.variable,
    sourceSerif.variable,
  ].join(' ');

  return (
    // The font variables must live on <html>: the design tokens in globals.css
    // (--font-display, --font-body…) are declared on :root and reference them.
    // Declared on <body> they were undefined at :root, which invalidated the
    // tokens and made the whole site fall back to Times.
    // Apparence choisie dans l'admin : variables CSS (polices, couleurs,
    // boutons) en style, réglages fins en data-* (voir src/lib/theme.ts).
    <html lang="fr" className={fontClasses} style={themeVars as React.CSSProperties} {...attrs}>
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
        <ThemeLive />
        <Header items={navItems} />
        {children}
        <Footer settings={settings} />
        {/* Compteur de visites interne (voir /admin/statistiques) */}
        <PageViewTracker />
      </body>
    </html>
  );
}
