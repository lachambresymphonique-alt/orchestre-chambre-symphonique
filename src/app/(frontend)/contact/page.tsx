import type { Metadata } from 'next';
import { getPayloadClient } from '@/lib/payload';
import { ContactClient } from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact — La Chambre Symphonique',
  description:
    "Contactez La Chambre Symphonique pour toute demande d'information, de réservation ou de partenariat.",
};

export default async function Contact() {
  const payload = await getPayloadClient();

  const siteSettings = await payload.findGlobal({ slug: 'site-settings' as any });

  return <ContactClient initialData={siteSettings as any} />;
}
