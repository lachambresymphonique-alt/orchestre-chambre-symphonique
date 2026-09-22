import type { Metadata } from 'next';
import { getPayloadClient } from '@/lib/payload';
import { getFormSecret, issueFormToken } from '@/lib/antispam';
import { ContactClient } from './ContactClient';

export const metadata: Metadata = {
  alternates: { canonical: '/contact' },
  title: 'Contact — La Chambre Symphonique',
  description:
    "Contactez La Chambre Symphonique pour toute demande d'information, de réservation ou de partenariat.",
};

export default async function Contact() {
  const payload = await getPayloadClient();

  const siteSettings = await payload.findGlobal({ slug: 'site-settings' as any });

  // Jeton anti-robot : émis à chaque rendu (page dynamique), vérifié par /api/contact.
  const formToken = issueFormToken(getFormSecret());
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null;

  return (
    <ContactClient
      initialData={siteSettings as any}
      formToken={formToken}
      turnstileSiteKey={turnstileSiteKey}
    />
  );
}
