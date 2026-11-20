import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getPayloadClient } from '@/lib/payload';
import { getMemberSession } from '@/lib/memberSession';
import { PROFILE_FIELDS } from '@/lib/profileFields';
import { profileFormState } from '@/lib/profileProposals';
import { latestProposal } from '@/lib/profileChanges';
import { ProposalStatus } from '../ProposalStatus';
import { ProfileForm } from './ProfileForm';
import '@/components/member-area.css';

/**
 * « Ma fiche » : le membre propose des modifications de sa fiche publique.
 * Le formulaire part de la proposition en attente s'il y en a une, sinon de
 * la fiche en ligne ; l'envoi ne publie rien (voir /api/membres/fiche).
 */

export const metadata: Metadata = {
  title: 'Ma fiche — Espace membres',
  robots: { index: false, follow: false },
};

export default async function MemberProfilePage() {
  const session = await getMemberSession();
  if (!session) redirect('/espace-membres');

  const payload = await getPayloadClient();
  const musician = (await payload.findByID({
    collection: 'musicians' as any,
    id: session.musician.id,
    depth: 1,
  })) as any;
  const latest = await latestProposal(payload, musician.id);
  const { values, photoUrl, photoPending } = await profileFormState(payload, musician);

  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> / <Link href="/espace-membres">Espace membres</Link> / Ma fiche
          </p>
          <h1>Ma fiche</h1>
          <p>Vos modifications sont relues par l’équipe avant d’être publiées.</p>
        </div>
      </div>
      <section className="contact-section member-area">
        <div className="member-area__inner">
          <ProposalStatus proposal={latest} />
          <ProfileForm
            fields={PROFILE_FIELDS}
            values={values}
            photoUrl={photoUrl}
            photoPending={photoPending}
          />
        </div>
      </section>
    </>
  );
}
