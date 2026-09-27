import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import '@/components/member-area.css';

/**
 * Page ouverte par le lien reçu par e-mail. Elle ne consomme pas le jeton :
 * c'est le bouton qui le poste à /api/membres/connexion. Les messageries qui
 * visitent les liens pour les analyser ne l'utilisent donc pas à la place du
 * membre. Pas de référent transmis : le jeton est dans l'adresse.
 */

export const metadata: Metadata = {
  title: 'Connexion — Espace membres',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function MemberSignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { jeton } = await searchParams;
  if (typeof jeton !== 'string' || !jeton) redirect('/espace-membres');

  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> / <Link href="/espace-membres">Espace membres</Link> / Connexion
          </p>
          <h1>Connexion</h1>
          <p>Un dernier clic pour ouvrir votre espace.</p>
        </div>
      </div>
      <section className="contact-section member-area">
        <div className="member-area__inner">
          <div className="contact-form">
            <p className="eyebrow eyebrow--gold">Espace membres</p>
            <h2 className="contact-form__title">
              <em>Bienvenue.</em>
            </h2>
            <hr className="velvet-rule" />
            <form method="post" action="/api/membres/connexion">
              <input type="hidden" name="jeton" value={jeton} />
              <button type="submit" className="btn-filled">
                Ouvrir mon espace →
              </button>
            </form>
            <p className="member-area__text member-area__hint">
              Ce lien ne sert qu’une fois. S’il a expiré,{' '}
              <Link href="/espace-membres">demandez-en un nouveau</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
