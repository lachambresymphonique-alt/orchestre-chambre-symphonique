import type { Metadata } from 'next';
import Link from 'next/link';
import { getFormSecret, issueFormToken } from '@/lib/antispam';
import { firstName, getMemberSession, type MemberSession } from '@/lib/memberSession';
import { placeholderForMusician } from '@/lib/unsplash';
import { getPayloadClient } from '@/lib/payload';
import { latestProposal } from '@/lib/profileChanges';
import { MemberLoginForm } from './MemberLoginForm';
import { ProposalStatus } from './ProposalStatus';
import '@/components/member-area.css';

/**
 * Espace membres : musiciens, bureau et équipe technique y retrouvent leur
 * fiche. On y entre par un lien reçu par e-mail (src/lib/memberSession.ts) ;
 * les comptes se créent depuis la fiche du musicien dans l'admin.
 */

export const metadata: Metadata = {
  title: 'Espace membres',
  robots: { index: false, follow: false },
};

const NOTICES: Record<string, string> = {
  invalide: 'Ce lien n’est plus valable : il a déjà servi ou il a expiré. Demandez-en un nouveau ci-dessous.',
  deconnecte: 'Vous êtes déconnecté·e.',
};

export default async function MemberAreaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getMemberSession();
  if (session) {
    const proposal = await latestProposal(await getPayloadClient(), session.musician.id);
    return <MemberHome session={session} proposal={proposal} />;
  }

  const params = await searchParams;
  const notice = params.lien === 'invalide' ? NOTICES.invalide : params.deconnecte ? NOTICES.deconnecte : null;

  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> / Espace membres
          </p>
          <h1>Espace membres</h1>
          <p>Musiciens, bureau, équipe technique : retrouvez ici votre fiche.</p>
        </div>
      </div>
      <section className="contact-section member-area">
        <div className="member-area__inner">
          {notice && (
            <p className="member-area__notice" role="status">
              {notice}
            </p>
          )}
          <MemberLoginForm
            formToken={issueFormToken(getFormSecret())}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null}
          />
        </div>
      </section>
    </>
  );
}

function MemberHome({ session, proposal }: { session: MemberSession; proposal: any | null }) {
  const { musician } = session;
  const photo = typeof musician.photo === 'object' && musician.photo ? musician.photo : null;
  const details = [musician.role, musician.instrument].filter(Boolean).join(' · ');

  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> / Espace membres
          </p>
          <h1>Bonjour, {firstName(musician.name)}</h1>
          <p>Votre espace au sein de La Chambre Symphonique.</p>
        </div>
      </div>
      <section className="contact-section member-area">
        <div className="member-area__inner member-area__home">
          <figure className="member-area__portrait">
            <img src={photo?.url || placeholderForMusician(musician.name)} alt={photo?.alt || musician.name} />
          </figure>
          <div className="contact-form">
            <p className="eyebrow eyebrow--gold">Votre fiche</p>
            <h2 className="contact-form__title">
              <em>{musician.name}</em>
            </h2>
            {details && <p className="member-area__details">{details}</p>}
            <hr className="velvet-rule" />
            <ProposalStatus proposal={proposal} />
            <p className="member-area__text">
              Mettez votre fiche à jour quand vous le souhaitez&nbsp;: chaque modification est
              relue par l’équipe avant d’être publiée.
            </p>
            <p className="member-area__actions">
              <Link className="btn-filled" href="/espace-membres/fiche">
                Modifier ma fiche →
              </Link>
            </p>
            {musician.slug && (
              <p>
                <Link className="link-arrow" href={`/musiciens/${musician.slug}`}>
                  Voir ma fiche publique →
                </Link>
              </p>
            )}
            <form method="post" action="/api/membres/deconnexion" className="member-area__logout">
              <button type="submit" className="link-arrow link-arrow--mute">
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
