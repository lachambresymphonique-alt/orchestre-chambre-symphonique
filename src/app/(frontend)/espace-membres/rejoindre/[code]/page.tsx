import type { Metadata } from 'next';
import Link from 'next/link';
import { getPayloadClient } from '@/lib/payload';
import { getFormSecret, issueFormToken } from '@/lib/antispam';
import { findActiveInviteLink } from '@/lib/inviteLinks';
import { getMemberSession } from '@/lib/memberSession';
import { PUPITRES } from '@/lib/pupitres';
import { JoinForm } from './JoinForm';
import '@/components/member-area.css';

/**
 * Page d'un lien d'inscription partagé dans une discussion. Elle recueille une
 * demande d'accès (POST /api/membres/demande) ; l'accès n'est ouvert qu'après
 * validation par l'équipe. Pas de référent transmis : le code est dans l'adresse.
 */

export const metadata: Metadata = {
  title: 'Rejoindre l’espace membres',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

const SUBTITLES = {
  musicien: 'Musiciens de La Chambre Symphonique : demandez votre accès à l’espace membres.',
  technique: 'Équipe technique de La Chambre Symphonique : demandez votre accès à l’espace membres.',
};

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const link = await findActiveInviteLink(await getPayloadClient(), code);
  const session = await getMemberSession();

  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> / <Link href="/espace-membres">Espace membres</Link> / Inscription
          </p>
          <h1>Rejoindre l’espace membres</h1>
          <p>{link ? SUBTITLES[link.role] : 'Espace réservé aux membres de l’orchestre.'}</p>
        </div>
      </div>
      <section className="contact-section member-area">
        <div className="member-area__inner">
          {session ? (
            <p className="member-area__notice" role="status">
              Vous avez déjà un accès.{' '}
              <Link href="/espace-membres">Ouvrir mon espace →</Link>
            </p>
          ) : link ? (
            <JoinForm
              code={code}
              role={link.role}
              pupitres={PUPITRES.map((p) => ({ value: p.value, label: p.label }))}
              formToken={issueFormToken(getFormSecret())}
              turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null}
            />
          ) : (
            <p className="member-area__notice" role="status">
              Ce lien d’inscription n’est plus valable. Demandez-en un nouveau à l’équipe de l’orchestre.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
