import type { Metadata } from 'next';
import { cache } from 'react';
import { getPayloadClient } from '@/lib/payload';
import { getFormSecret, issueFormToken } from '@/lib/antispam';
import { ContactClient } from './ContactClient';

const getContactPage = cache(async () => {
  const payload = await getPayloadClient();
  try {
    return (await payload.findGlobal({ slug: 'contact-page' as any })) as any;
  } catch {
    return null;
  }
});

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContactPage();
  return {
    alternates: { canonical: '/contact' },
    title: page?.seo?.metaTitle || 'Contact — La Chambre Symphonique',
    description:
      page?.seo?.metaDescription ||
      "Contactez La Chambre Symphonique pour toute demande d'information, de réservation ou de partenariat.",
  };
}

export default async function Contact() {
  const payload = await getPayloadClient();

  const [siteSettings, contactPage] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings' as any }),
    getContactPage(),
  ]);

  // Jeton anti-robot : émis à chaque rendu (page dynamique), vérifié par /api/contact.
  const formToken = issueFormToken(getFormSecret());
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null;

  return (
    <ContactClient
      initialData={siteSettings as any}
      pageContent={contactPage}
      formToken={formToken}
      turnstileSiteKey={turnstileSiteKey}
    />
  );
}
