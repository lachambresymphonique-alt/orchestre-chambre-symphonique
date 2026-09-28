import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getPayloadClient } from '@/lib/payload';
import { getMemberSession } from '@/lib/memberSession';
import { canSeeDocument, documentExpiry, recipientLabel } from '@/lib/pupitres';
import { DOCUMENT_TYPES, formatBytes } from '@/lib/documentTypes';
import '@/components/member-area.css';

/**
 * Partitions et documents : ceux qui sont adressés au membre (pupitre,
 * groupe ou tous), classés par concert, tant qu'ils sont visibles. Le
 * téléchargement repasse par /api/membres/documents/:id/fichier, qui
 * revérifie les droits.
 */

export const metadata: Metadata = {
  title: 'Partitions et documents — Espace membres',
  robots: { index: false, follow: false },
};

const formatDate = (value: Date | string | null | undefined) =>
  value ? new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

type Group = { key: string; title: string; date: string | null; expiry: Date | null; docs: any[] };

export default async function MemberDocumentsPage() {
  const session = await getMemberSession();
  if (!session) redirect('/espace-membres');
  const { musician } = session;

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'member-documents' as any,
    depth: 1,
    limit: 500,
    sort: 'title',
    overrideAccess: true,
  });

  const now = Date.now();
  const groups = new Map<string, Group>();
  for (const doc of result.docs as any[]) {
    if (!doc.fileKey || !canSeeDocument(musician, doc.recipients)) continue;
    const expiry = documentExpiry(doc);
    if (expiry && expiry.getTime() < now) continue;
    const concert = doc.concert && typeof doc.concert === 'object' ? doc.concert : null;
    const key = concert ? `concert-${concert.id}` : 'autres';
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        title: concert ? concert.title : 'Autres documents',
        date: concert ? concert.date ?? null : null,
        expiry: concert ? expiry : null,
        docs: [],
      });
    }
    groups.get(key)!.docs.push(doc);
  }
  // Concerts dans l'ordre chronologique, documents hors concert à la fin.
  const ordered = [...groups.values()].sort((a, b) => {
    if (a.key === 'autres') return 1;
    if (b.key === 'autres') return -1;
    return (a.date ? Date.parse(a.date) : 0) - (b.date ? Date.parse(b.date) : 0);
  });

  const hasGroup = ['direction', 'technique', 'bureau'].includes(musician.section ?? '');
  const noPupitre = !hasGroup && !(musician.pupitres ?? []).length;

  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> / <Link href="/espace-membres">Espace membres</Link> / Partitions et documents
          </p>
          <h1>Partitions et documents</h1>
          <p>Réservés aux membres de l’orchestre&nbsp;: merci de ne pas les diffuser.</p>
        </div>
      </div>
      <section className="contact-section member-area">
        <div className="member-area__inner member-docs">
          {noPupitre && (
            <p className="member-area__notice" role="status">
              Votre pupitre n’est pas encore renseigné&nbsp;: vous ne voyez que les documents adressés à tous.
              Signalez-le à l’équipe.
            </p>
          )}
          {ordered.length === 0 && (
            <p className="member-area__text">
              Aucun document pour l’instant. Les partitions de vos prochains concerts apparaîtront ici.
            </p>
          )}
          {ordered.map((group) => (
            <div key={group.key} className="member-docs__group">
              <p className="eyebrow eyebrow--gold">
                {group.date ? formatDate(group.date) : group.key === 'autres' ? 'Hors concert' : 'Concert'}
              </p>
              <h2 className="contact-form__title">
                <em>{group.title}</em>
              </h2>
              {group.expiry && (
                <p className="member-area__help">Disponibles jusqu’au {formatDate(group.expiry)}.</p>
              )}
              <ul className="member-docs__list">
                {group.docs.map((doc) => (
                  <li key={doc.id} className="member-docs__item">
                    <a
                      className="member-docs__link"
                      href={`/api/membres/documents/${doc.id}/fichier`}
                      target="_blank"
                      rel="noopener"
                    >
                      <span className="member-docs__title">{doc.title}</span>
                      <span className="member-docs__meta">
                        {[DOCUMENT_TYPES[doc.fileType] ?? '', formatBytes(doc.fileSize), (doc.recipients ?? []).map(recipientLabel).join(', ')]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </a>
                    {doc.notes && <p className="member-docs__note">{doc.notes}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="member-docs__back">
            <Link className="link-arrow link-arrow--mute" href="/espace-membres">
              ← Retour à mon espace
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
