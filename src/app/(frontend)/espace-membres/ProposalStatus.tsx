/** État de la dernière proposition de modification, en tête des pages de l'espace membres. */

const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

export function ProposalStatus({ proposal }: { proposal: any | null }) {
  if (!proposal) return null;
  const note = typeof proposal.reviewNote === 'string' ? proposal.reviewNote.trim() : '';

  if (proposal.status === 'en-attente') {
    return (
      <div className="member-area__notice" role="status">
        <p>
          Modification envoyée le {formatDate(proposal.submittedAt)}, en attente de relecture par
          l’équipe. Vous pouvez encore la compléter&nbsp;: un nouvel envoi remplace le précédent.
        </p>
      </div>
    );
  }
  if (proposal.status === 'refusee') {
    return (
      <div className="member-area__notice" role="status">
        <p>Votre proposition du {formatDate(proposal.submittedAt)} n’a pas été publiée.</p>
        {note && <p className="member-area__note">{note}</p>}
      </div>
    );
  }
  return (
    <div className="member-area__notice" role="status">
      <p>Votre dernière modification a été publiée le {formatDate(proposal.decidedAt)}.</p>
      {note && <p className="member-area__note">{note}</p>}
    </div>
  );
}
