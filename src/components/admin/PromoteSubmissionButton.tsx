'use client';

import './admin-theme.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDocumentInfo, useModal, ConfirmationModal } from '@payloadcms/ui';

export function PromoteSubmissionButton() {
  const router = useRouter();
  const docInfo = useDocumentInfo();
  const id = docInfo?.id;
  const { openModal, closeModal } = useModal();
  const [status, setStatus] = useState<'idle' | 'pending' | 'error' | 'done'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [info, setInfo] = useState('');

  const modalSlug = `promote-musician-${id ?? 'new'}`;

  if (!id) {
    return (
      <div className="lcs-promote lcs-promote--inline" aria-label="Validation">
        <span className="lcs-promote__hint">
          Sauvegardez la fiche pour pouvoir la valider.
        </span>
      </div>
    );
  }

  const runPromote = async () => {
    setStatus('pending');
    setErrorMsg('');
    setInfo('');

    try {
      const res = await fetch(`/api/musician-submissions/${id}/promote`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));

      if (res.status === 409) {
        setInfo(json?.message || 'Cette fiche a déjà été recopiée dans Musiciens.');
        if (json?.musicianId) {
          router.push(`/admin/collections/musicians/${json.musicianId}`);
        }
        setStatus('done');
        return;
      }

      if (!res.ok) {
        throw new Error(json?.error || `Erreur ${res.status}`);
      }

      setStatus('done');
      const target = json?.redirectTo || `/admin/collections/musicians/${json?.musicianId ?? ''}`;
      router.push(target);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Une erreur est survenue.');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 6000);
    }
  };

  const handleClick = () => {
    if (status === 'pending' || status === 'done') return;
    openModal(modalSlug);
  };

  return (
    <div className="lcs-promote lcs-promote--inline">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === 'pending' || status === 'done'}
        className="lcs-promote__btn"
        title="Crée un musicien dans la collection publique à partir de cette fiche"
      >
        <span className="lcs-promote__btn-icon" aria-hidden>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8.5l3 3 7-7" />
          </svg>
        </span>
        <span>
          {status === 'pending'
            ? 'Création…'
            : status === 'done'
              ? 'Fiche créée — redirection…'
              : 'Ajouter à la liste de musiciens'}
        </span>
      </button>
      {info && <span className="lcs-promote__info">{info}</span>}
      {status === 'error' && (
        <span className="lcs-promote__error" role="alert">
          {errorMsg}
        </span>
      )}

      <ConfirmationModal
        modalSlug={modalSlug}
        heading="Ajouter à la liste de musiciens ?"
        body={
          <div className="lcs-promote-modal-body">
            <p>
              Une nouvelle fiche va être créée dans la collection{' '}
              <strong>Musiciens</strong> à partir de cette soumission.
            </p>
            <ul className="lcs-promote-modal-list">
              <li>
                Elle sera ajoutée <em>à la fin</em> de sa section.
              </li>
              <li>
                Le statut de la soumission passera à{' '}
                <em>« Recopié dans Musiciens »</em>.
              </li>
              <li>
                Vous serez redirigé·e sur la nouvelle fiche pour ajuster
                l’ordre, le slug ou la photo.
              </li>
            </ul>
          </div>
        }
        confirmLabel="Créer la fiche"
        cancelLabel="Annuler"
        confirmingLabel="Création…"
        onConfirm={async () => {
          closeModal(modalSlug);
          await runPromote();
        }}
      />
    </div>
  );
}

export default PromoteSubmissionButton;
