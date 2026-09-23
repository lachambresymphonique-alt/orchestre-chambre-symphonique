'use client';

import { MusicianDetail, type Musician } from '@/components/MusicianDetail';
import { useLiveDoc } from '@/hooks/useLiveDocument';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';

/**
 * Aperçu d'une fiche musicien reçue, en direct : chaque correction faite dans
 * l'admin (Fiches musiciens reçues) s'affiche aussitôt.
 */

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
  // Prénom et nom d'abord : ce sont eux qu'on corrige dans l'admin (« name »
  // n'est recalculé qu'à l'enregistrement).
  const computedName =
    [s?.firstName, s?.lastName].filter(Boolean).join(' ').trim() ||
    (typeof s?.name === 'string' && s.name.trim()) ||
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

export function SubmissionPreview({ submission }: { submission: any }) {
  const live = useLiveDoc('musician-submissions', submission);
  useLivePreviewSync(null);
  return <MusicianDetail musician={submissionToMusician(live)} previewMode />;
}
