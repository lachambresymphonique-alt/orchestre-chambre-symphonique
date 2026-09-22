import type { Metadata } from 'next';
import { cache } from 'react';
import { getPayloadClient } from '@/lib/payload';
import { SupportClient } from './SupportClient';

const getSupportPage = cache(async () => {
  const payload = await getPayloadClient();
  return payload.findGlobal({ slug: 'support-page' as any });
});

export async function generateMetadata(): Promise<Metadata> {
  const supportPage = (await getSupportPage()) as any;
  return {
    alternates: { canonical: '/nous-soutenir' },
    title: supportPage?.seo?.metaTitle || 'Nous soutenir — La Chambre Symphonique',
    description:
      supportPage?.seo?.metaDescription ||
      "Soutenez La Chambre Symphonique par une adhésion, un don ou du bénévolat. Association bénévole d'intérêt général.",
  };
}

export default async function NousSoutenir() {
  const payload = await getPayloadClient();

  const [supportPage, supportTiers] = await Promise.all([
    getSupportPage(),
    payload.find({ collection: 'support-tiers' as any }),
  ]);

  return (
    <SupportClient
      initialData={supportPage as any}
      tiers={supportTiers.docs as any[]}
    />
  );
}
