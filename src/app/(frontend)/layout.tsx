import type { Metadata } from 'next';
import { Cormorant_Garamond, Montserrat } from 'next/font/google';
import '../globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getPayloadClient } from '@/lib/payload';

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'La Chambre Symphonique — Orchestre',
  description:
    "La Chambre Symphonique, orchestre fondé en 2017 par Loïc Emmelin. Plus de 80 musiciens réunis par la passion du répertoire symphonique en Bourgogne et Rhône-Alpes.",
};

export const dynamic = 'force-dynamic';

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const payload = await getPayloadClient();
  const siteSettings = await payload.findGlobal({ slug: 'site-settings' as any });

  let extraNavItems: { href: string; label: string; order: number }[] = [];
  try {
    const navPages = await payload.find({
      collection: 'pages' as any,
      where: { showInNav: { equals: true }, _status: { equals: 'published' } },
      sort: 'navOrder',
      limit: 20,
    });
    extraNavItems = navPages.docs.map((page: any) => ({
      href: `/${page.slug}`,
      label: page.navLabel || page.title,
      order: page.navOrder ?? 99,
    }));
  } catch {
    // Pages table may not exist yet — skip gracefully
  }

  const settings = {
    description: (siteSettings as any).footerDescription,
    contact: (siteSettings as any).contact,
  };

  return (
    <html lang="fr">
      <body className={`${cormorant.variable} ${montserrat.variable}`}>
        <Header extraNavItems={extraNavItems} />
        {children}
        <Footer settings={settings} />
      </body>
    </html>
  );
}
