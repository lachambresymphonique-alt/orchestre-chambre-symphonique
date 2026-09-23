import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import { getPayloadClient } from '@/lib/payload';
import { isEditorRequest } from '@/lib/posts';
import {
  findConcertByPreviousSlug,
  findConcertBySlug,
  findUpcomingConcerts,
  toConcertCard,
  type ConcertCard,
  type ConcertDoc,
} from '@/lib/concerts';
import {
  absoluteUrl,
  concertBreadcrumb,
  concertEvents,
  concertMetaDescription,
  concertMetaTitle,
  jsonLdString,
  SITE_NAME,
} from '@/lib/concertSeo';
import { RefreshOnSave } from '@/components/RefreshOnSave';
import { ConcertDetail } from './ConcertDetail';

type Args = { params: Promise<{ slug: string }> };

type Loaded = { doc: ConcertDoc; card: ConcertCard; preview: boolean } | null;

/**
 * Concert publié (ou annulé) par son adresse. Un brouillon n'est servi qu'aux
 * personnes connectées à l'admin, pour l'aperçu en direct, et n'est jamais indexé.
 */
const loadConcert = cache(async (slug: string): Promise<Loaded> => {
  const payload = await getPayloadClient();
  let doc = await findConcertBySlug(payload as any, slug);
  let preview = false;
  if (!doc && (await isEditorRequest())) {
    doc = await findConcertBySlug(payload as any, slug, { withDrafts: true });
    preview = !!doc;
  }
  if (!doc) return null;
  const card = toConcertCard(doc);
  if (!card) return null;
  return { doc, card, preview: preview || doc.status === 'draft' };
});

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadConcert(slug);
  if (!loaded) return { title: 'Concert introuvable', robots: { index: false } };
  const { doc, card, preview } = loaded;

  const title = concertMetaTitle(card, doc.meta);
  const description = concertMetaDescription(card, doc.meta);
  const url = card.url || `/concerts/${slug}`;
  const images = card.image
    ? [
        {
          url: absoluteUrl(card.image.url),
          alt: card.image.alt || card.title,
          ...(card.image.width && card.image.height ? { width: card.image.width, height: card.image.height } : {}),
        },
      ]
    : undefined;

  // Next.js remplace le bloc openGraph du layout par celui de la page (pas de
  // fusion) : on redonne donc ici le nom du site, la langue et l'URL.
  return {
    title,
    description,
    alternates: { canonical: url },
    ...(preview ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      siteName: SITE_NAME,
      url,
      title,
      description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}

export default async function ConcertPage({ params }: Args) {
  const { slug } = await params;
  const loaded = await loadConcert(slug);
  if (!loaded) {
    // Ancienne adresse (l'adresse a été modifiée dans l'admin) : redirection permanente.
    const payload = await getPayloadClient();
    const moved = await findConcertByPreviousSlug(payload as any, slug).catch(() => null);
    if (moved?.slug && moved.slug !== slug) permanentRedirect(`/concerts/${moved.slug}`);
    notFound();
  }
  const { doc, card, preview } = loaded;

  // Les autres concerts à venir : maillage interne et suite de la visite.
  let others: ConcertCard[] = [];
  try {
    const payload = await getPayloadClient();
    others = (await findUpcomingConcerts(payload as any, { limit: 4 }))
      .filter((c) => String(c.id) !== String(card.id))
      .slice(0, 3);
  } catch {
    others = [];
  }

  // Données structurées : une représentation = un MusicEvent, plus le fil d'Ariane.
  // Un brouillon (aperçu) n'en émet pas.
  const jsonLd = preview ? null : [...concertEvents(card), concertBreadcrumb(card)];

  return (
    <>
      <RefreshOnSave />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />}
      <ConcertDetail doc={doc} initial={card} others={others} />
    </>
  );
}
