import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getPayloadClient } from '@/lib/payload';
import { RefreshOnSave } from '@/components/RefreshOnSave';
import { SubmissionPreview } from './SubmissionPreview';

export const metadata: Metadata = {
  title: 'Aperçu — fiche musicien',
  robots: { index: false, follow: false },
};

export default async function MusicianPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await getPayloadClient();

  // Une fiche reçue n'est publique qu'après validation (« Ajouter à la liste de
  // musiciens »). Avant, seul un admin connecté peut la prévisualiser : c'est
  // cette page qu'affiche l'aperçu en direct de l'admin, sur le même domaine.
  let user: unknown = null;
  try {
    ({ user } = await payload.auth({ headers: await headers() }));
  } catch {
    user = null;
  }
  if (!user) notFound();

  let submission: any;
  try {
    submission = await payload.findByID({
      collection: 'musician-submissions' as any,
      id,
      depth: 1,
      overrideAccess: true,
    });
  } catch {
    notFound();
  }
  if (!submission) notFound();

  return (
    <>
      <RefreshOnSave />
      <SubmissionPreview submission={submission} />
    </>
  );
}
