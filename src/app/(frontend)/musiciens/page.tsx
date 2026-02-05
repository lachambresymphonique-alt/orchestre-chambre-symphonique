import type { Metadata } from 'next';
import Link from 'next/link';
import { FadeIn } from '@/components/FadeIn';
import { PersonPlaceholder } from '@/components/PlaceholderIcon';
import { getPayloadClient } from '@/lib/payload';

export const metadata: Metadata = {
  title: 'Musiciens — La Chambre Symphonique',
  description:
    "Découvrez les musiciens de La Chambre Symphonique, orchestre de 40 à 80 musiciens dirigé par Loïc Emmelin.",
};

function MusicianCard({ name, role, instrument }: { name: string; role: string; instrument?: string }) {
  return (
    <FadeIn className="musician-card">
      <div className="musician-photo">
        <PersonPlaceholder size={60} />
      </div>
      <h3>{name}</h3>
      <p className="role">{role}</p>
      {instrument && <p className="instrument">{instrument}</p>}
    </FadeIn>
  );
}

export default async function Musiciens() {
  const payload = await getPayloadClient();

  const musicians = await payload.find({
    collection: 'musicians' as any,
    sort: 'order' as any,
    limit: 50,
  });

  const allMusicians = musicians.docs as any[];
  const direction = allMusicians.filter((m) => m.section === 'direction');
  const cordes = allMusicians.filter((m) => m.section === 'cordes');
  const vents = allMusicians.filter((m) => m.section === 'vents');
  const claviers = allMusicians.filter((m) => m.section === 'claviers');

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> / Musiciens
          </p>
          <h1>Nos musiciens</h1>
          <p>
            De 40 à 80 musiciens issus de conservatoires français, suisses et belges,
            réunis autour de la passion du répertoire symphonique.
          </p>
        </div>
      </div>

      {/* DIRECTION */}
      <section style={{ background: 'var(--color-bg)' }}>
        <div className="container">
          <div className="section-divider">
            <h3>Direction artistique</h3>
          </div>
          <div className="musicians-grid">
            {direction.map((m) => (
              <MusicianCard key={m.id || m.name} name={m.name} role={m.role} instrument={m.instrument} />
            ))}
          </div>
        </div>
      </section>

      {/* CORDES */}
      <section style={{ background: 'var(--color-bg-alt)' }}>
        <div className="container">
          <div className="section-divider">
            <h3>Les Cordes</h3>
          </div>
          <div className="musicians-grid">
            {cordes.map((m) => (
              <MusicianCard key={m.id || m.name} name={m.name} role={m.role} instrument={m.instrument} />
            ))}
          </div>
        </div>
      </section>

      {/* VENTS */}
      <section style={{ background: 'var(--color-bg)' }}>
        <div className="container">
          <div className="section-divider">
            <h3>Les Vents</h3>
          </div>
          <div className="musicians-grid">
            {vents.map((m) => (
              <MusicianCard key={m.id || m.name} name={m.name} role={m.role} instrument={m.instrument} />
            ))}
          </div>
        </div>
      </section>

      {/* CLAVIERS & PERCUSSIONS */}
      <section style={{ background: 'var(--color-bg-alt)' }}>
        <div className="container">
          <div className="section-divider">
            <h3>Claviers &amp; Percussions</h3>
          </div>
          <div className="musicians-grid">
            {claviers.map((m) => (
              <MusicianCard key={m.id || m.name} name={m.name} role={m.role} instrument={m.instrument} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
