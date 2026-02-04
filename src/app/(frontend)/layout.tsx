import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getPayloadClient } from '@/lib/payload';

export const dynamic = 'force-dynamic';

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const payload = await getPayloadClient();
  const siteSettings = await payload.findGlobal({ slug: 'site-settings' as any });

  const settings = {
    description: (siteSettings as any).footerDescription,
    contact: (siteSettings as any).contact,
  };

  return (
    <>
      <Header />
      {children}
      <Footer settings={settings} />
    </>
  );
}
