import type { Metadata } from 'next';
import { MusicianSubmissionForm } from '@/components/MusicianSubmissionForm';

export const metadata: Metadata = {
  title: 'Compléter ma fiche musicien — La Chambre Symphonique',
  description:
    'Formulaire à destination des musiciens de l’orchestre pour transmettre leur biographie, leur formation et leurs liens vidéo.',
  robots: { index: false, follow: false },
};

export default function MusicianContributePage() {
  return (
    <div className="contribute-page">
      <span className="contribute-halo" aria-hidden />

      <header className="contribute-hero contribute-hero--simple">
        <p className="eyebrow eyebrow--gold">À l’attention des musiciens</p>
        <h1 className="contribute-hero__title">
          <em>Votre fiche</em>
          <br />
          sur le site.
        </h1>
      </header>

      <section className="contribute-form-wrap">
        <MusicianSubmissionForm />
      </section>
    </div>
  );
}
