import type { Metadata } from 'next';
import { getPayloadClient } from '@/lib/payload';
import { SupportClient } from './SupportClient';

export const metadata: Metadata = {
  title: 'Nous soutenir — La Chambre Symphonique',
  description:
    "Soutenez La Chambre Symphonique par une adhésion, un don ou du bénévolat. Association bénévole d'intérêt général.",
};

export default async function NousSoutenir() {
  const payload = await getPayloadClient();

  const [supportPage, supportTiers] = await Promise.all([
    payload.findGlobal({ slug: 'support-page' as any }),
    payload.find({ collection: 'support-tiers' as any }),
  ]);

  return (
    <SupportClient
      initialData={supportPage as any}
      tiers={supportTiers.docs as any[]}
    />
  );
}
