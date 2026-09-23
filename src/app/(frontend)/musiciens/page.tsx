import type { Metadata } from 'next';
import { cache } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FadeIn } from '@/components/FadeIn';
import { getPayloadClient } from '@/lib/payload';
import { RefreshOnSave } from '@/components/RefreshOnSave';
import { LivePreviewSync } from '@/components/LivePreviewSync';
import { placeholderForMusician } from '@/lib/unsplash';

const getMusiciansPage = cache(async () => {
  const payload = await getPayloadClient();
  try {
    return (await payload.findGlobal({ slug: 'musicians-page' as any })) as any;
  } catch {
    return null;
  }
});

export async function generateMetadata(): Promise<Metadata> {
  const page = await getMusiciansPage();
  return {
    alternates: { canonical: '/musiciens' },
    title: page?.seo?.metaTitle || 'Musiciens — La Chambre Symphonique',
    description:
      page?.seo?.metaDescription ||
      "Les musiciens de l'Orchestre de la Chambre Symphonique, dirigé par Loïc Emmelin.",
  };
}

type Musician = {
  id?: string;
  name: string;
  role: string;
  instrument?: string;
  section: 'direction' | 'cordes' | 'vents' | 'claviers';
  photo?: { url?: string; alt?: string } | null;
  slug?: string;
};

function MusicianCard({ musician, featured = false }: { musician: Musician; featured?: boolean }) {
  const { name, role, instrument, photo, slug, id } = musician;
  const handle = slug || id;
  const hasLink = Boolean(handle);

  const photoUrl = photo?.url || placeholderForMusician(name);

  const Inner = (
    <>
      <div className="musician-photo">
        <Image
          src={photoUrl}
          alt={photo?.alt || name}
          fill
          sizes={featured ? '(max-width: 700px) 100vw, 480px' : '(max-width: 700px) 50vw, 280px'}
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
      </div>
      <h3 className="musician-name">{name}</h3>
      <p className="role">{role}</p>
      {instrument && <p className="instrument">{instrument}</p>}
    </>
  );

  return (
    <FadeIn
      className={`musician-card${featured ? ' featured' : ''}`}
      // Cliquer un musicien dans l'aperçu ouvre sa fiche dans l'admin.
      data-live-link={id ? `/admin/collections/musicians/${id}` : undefined}
    >
      {hasLink ? (
        <Link href={`/musiciens/${handle}`} style={{ display: 'contents' }}>
          {Inner}
        </Link>
      ) : (
        Inner
      )}
    </FadeIn>
  );
}

function Section({ title, count, musicians }: { title: string; count: number; musicians: Musician[] }) {
  if (musicians.length === 0) return null;
  return (
    <section className="section-musicians" data-live-field="sections">
      <header className="musicians-section-head">
        <h2>{title}</h2>
        <span className="rule" aria-hidden />
        <span className="count">
          {count.toString().padStart(2, '0')}
        </span>
      </header>
      <div className="musicians-grid">
        {musicians.map((m, i) => (
          <MusicianCard
            key={m.id || `${m.name}-${i}`}
            musician={m}
            featured={m.section === 'direction' && musicians.length <= 2}
          />
        ))}
      </div>
    </section>
  );
}

export default async function Musiciens() {
  const payload = await getPayloadClient();
  // Titles editable in Pages → Page Musiciens.
  const page = await getMusiciansPage();
  const header = page?.header || {};
  const sections = page?.sections || {};

  const musicians = await payload.find({
    collection: 'musicians' as any,
    sort: 'order' as any,
    limit: 100,
    depth: 1,
  });

  const all = musicians.docs as Musician[];
  const direction = all.filter((m) => m.section === 'direction');
  const cordes = all.filter((m) => m.section === 'cordes');
  const vents = all.filter((m) => m.section === 'vents');
  const claviers = all.filter((m) => m.section === 'claviers');

  return (
    <div className="musicians-page">
      <RefreshOnSave />
      <LivePreviewSync />

      <div className="page-header" data-live-field="header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> &nbsp;/&nbsp; Musiciens
          </p>
          <h1>{header.title || 'Les visages de l\'orchestre'}</h1>
          <p>
            {header.lede ||
              'De 40 à 80 musiciens issus de conservatoires français, suisses et belges, réunis autour de la passion du répertoire symphonique.'}
          </p>
        </div>
      </div>

      <Section title={sections.direction || 'Direction artistique'} count={direction.length} musicians={direction} />
      <Section title={sections.cordes || 'Les Cordes'} count={cordes.length} musicians={cordes} />
      <Section title={sections.vents || 'Les Vents'} count={vents.length} musicians={vents} />
      <Section title={sections.claviers || 'Claviers & Percussions'} count={claviers.length} musicians={claviers} />
    </div>
  );
}
