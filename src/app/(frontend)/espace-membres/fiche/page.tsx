import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getPayloadClient } from '@/lib/payload';
import { getMemberSession } from '@/lib/memberSession';
import { PROFILE_FIELDS, comparable } from '@/lib/profileFields';
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
  const pending = latest?.status === 'en-attente' ? latest : null;
  const inPending = (name: string) => Boolean(pending?.changedFields?.includes(name));

  const values: Record<string, string> = {};
  for (const field of PROFILE_FIELDS) {
    if (field.kind === 'photo') continue;
    values[field.name] = comparable(field.name, inPending(field.name) ? pending[field.name] : musician[field.name]);
  }
  const photo = inPending('photo') ? pending.photo : musician.photo;
  const photoUrl = photo && typeof photo === 'object' ? photo.sizes?.card?.url || photo.url || null : null;

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
            photoPending={inPending('photo')}
          />
        </div>
      </section>
    </>
  );
}
