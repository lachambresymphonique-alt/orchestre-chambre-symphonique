import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPayloadClient } from '@/lib/payload';
import { RefreshOnSave } from '@/components/RefreshOnSave';
import { MusicianDetailLive } from '@/components/MusicianDetailLive';
import type { Musician } from '@/components/MusicianDetail';
import { isEditorRequest } from '@/lib/posts';
import { isMusicianPublic } from '@/lib/musicianVisibility';

async function getMusician(handle: string): Promise<Musician | null> {
  const payload = await getPayloadClient();

  // First try slug
  const bySlug = await payload.find({
    collection: 'musicians' as any,
    where: { slug: { equals: handle } } as any,
    limit: 1,
    depth: 1,
  });
  if (bySlug.docs?.[0]) return bySlug.docs[0] as Musician;

  // Fallback: try id (for existing musicians without slug)
  try {
    const byId = await payload.findByID({
      collection: 'musicians' as any,
      id: handle,
      depth: 1,
    });
    return (byId as Musician) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = await getMusician(slug);
  if (!m || !isMusicianPublic(m as any)) return { title: 'Musicien introuvable', robots: { index: false } };
  const canonicalHandle = (m as any).slug || slug;
  const photoUrl = (m as any).photo?.url as string | undefined;
  return {
    title: `${m.name} — La Chambre Symphonique`,
    description: m.tagline || `${m.role}${m.instrument ? ` — ${m.instrument}` : ''}`,
    alternates: { canonical: `/musiciens/${canonicalHandle}` },
    ...(photoUrl ? { openGraph: { images: [{ url: photoUrl }] } } : {}),
  };
}

export default async function MusicianPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = await getMusician(slug);
  if (!m) notFound();
  // Fiche qui n'est pas « En ligne » : introuvable pour le public ; l'équipe connectée la voit, avec un bandeau.
  const offline = !isMusicianPublic(m as any);
  if (offline && !(await isEditorRequest())) notFound();

  // Section names and fiche labels are editable in Pages → Page Musiciens.
  let labels: any = null;
  try {
    const payload = await getPayloadClient();
    labels = await payload.findGlobal({ slug: 'musicians-page' as any });
  } catch {
    labels = null;
  }

  return (
    <>
      <RefreshOnSave />
      {offline && (
        <p role="status" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60, margin: 0, padding: '0.75rem var(--gutter)', background: 'var(--velvet)', color: 'var(--on-bordeaux, #fff)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', textAlign: 'center' }}>
          Fiche hors ligne : seule l’équipe connectée la voit. Passez-la « En ligne » dans l’admin pour la publier.
        </p>
      )}
      <MusicianDetailLive musician={m} labels={labels} />
    </>
  );
}
