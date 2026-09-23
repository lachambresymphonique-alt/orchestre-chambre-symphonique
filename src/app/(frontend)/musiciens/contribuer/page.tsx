import type { Metadata } from 'next';
import { MusicianSubmissionForm } from '@/components/MusicianSubmissionForm';
import { getFormSecret, issueFormToken } from '@/lib/antispam';

export const metadata: Metadata = {
  title: 'Compléter ma fiche musicien — La Chambre Symphonique',
  description:
    'Formulaire à destination des musiciens de l’orchestre pour transmettre leur biographie, leur formation et leurs liens vidéo.',
  robots: { index: false, follow: false },
};

export default function MusicianContributePage() {
  // Jeton anti-robot : émis à chaque rendu (page dynamique), vérifié par /api/musician-submissions.
  const formToken = issueFormToken(getFormSecret());
  // Captcha Cloudflare Turnstile : mêmes clés que le formulaire de contact ; absent tant qu'elles ne sont pas configurées.
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null;

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
        <MusicianSubmissionForm formToken={formToken} turnstileSiteKey={turnstileSiteKey} />
      </section>
    </div>
  );
}
