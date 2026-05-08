import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPayloadClient } from '@/lib/payload';
import { RefreshOnSave } from '@/components/RefreshOnSave';
import { MusicianDetail, type Musician } from '@/components/MusicianDetail';

export const metadata: Metadata = {
  title: 'Aperçu — fiche musicien',
  robots: { index: false, follow: false },
};

const VALID_SECTIONS: Musician['section'][] = ['direction', 'cordes', 'vents', 'claviers'];

function lines(text: string | undefined | null): { item: string }[] | undefined {
  if (!text) return undefined;
  const items = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((item) => ({ item }));
  return items.length > 0 ? items : undefined;
}

function submissionToMusician(s: any): Musician {
  const computedName =
    (typeof s?.name === 'string' && s.name.trim()) ||
    [s?.firstName, s?.lastName].filter(Boolean).join(' ').trim() ||
    'Musicien·ne';

  const section: Musician['section'] = VALID_SECTIONS.includes(s?.section)
    ? s.section
    : 'cordes';

  return {
    id: s?.id,
    name: computedName,
    role: s?.role || '—',
    instrument: s?.instrument || undefined,
    section,
    photo: s?.photo
      ? { url: s.photo?.url, alt: s.photo?.alt || computedName }
      : null,
    tagline: s?.tagline || undefined,
    bio: s?.bio || undefined,
    quote: s?.quote || undefined,
    formation: lines(s?.formation),
    concours: lines(s?.concours),
    videoUrl: s?.videoUrl || undefined,
    inspiringSymphony: s?.inspiringSymphony || undefined,
    favoriteWork: s?.favoriteWork || undefined,
    favoriteComposer: s?.favoriteComposer || undefined,
  };
}

export default async function MusicianPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await getPayloadClient();

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

  const musician = submissionToMusician(submission);

  return (
    <>
      <RefreshOnSave />
      <MusicianDetail musician={musician} previewMode />
    </>
  );
}
