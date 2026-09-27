'use client';

import './admin-theme.css';
import './admin-profile-change.css';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmationModal, useDocumentInfo, useFormModified, useModal } from '@payloadcms/ui';

/**
 * « Refuser » et « Appliquer à la fiche », à côté de Sauvegarder sur une
 * modification proposée. Logique côté serveur :
 * /api/membres/modifications/:id/{appliquer,refuser}.
 */

type Row = { name: string; label: string; conflict: boolean };
type Info = {
  status: 'en-attente' | 'appliquee' | 'refusee';
  decidedAt: string | null;
  reviewNote: string;
  musician: { name: string } | null;
  rows: Row[];
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

export function ProfileChangeReview() {
  const router = useRouter();
  const { id, lastUpdateTime } = useDocumentInfo();
  const modified = useFormModified();
  const { openModal, closeModal } = useModal();
  const [info, setInfo] = useState<Info | null>(null);
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const applySlug = `profile-change-apply-${id ?? 'new'}`;
  const refuseSlug = `profile-change-refuse-${id ?? 'new'}`;

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/membres/modifications/${id}`, { credentials: 'include' });
      if (!res.ok) return;
      const json = (await res.json()) as Info;
      setInfo(json);
      setNote(json.reviewNote || '');
    } catch {
      // L'état se rechargera à la prochaine sauvegarde.
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load, lastUpdateTime]);

  if (!id || !info) return null;

  if (info.status !== 'en-attente') {
    return (
      <div className="lcs-promote lcs-promote--inline">
        <span className="lcs-promote__info">
          {info.status === 'appliquee' ? 'Appliquée' : 'Refusée'}
          {info.decidedAt ? ` le ${formatDate(info.decidedAt)}` : ''}
        </span>
      </div>
    );
  }

  const decide = async (action: 'appliquer' | 'refuser') => {
    setPending(true);
    setError('');
    try {
      const res = await fetch(`/api/membres/modifications/${id}/${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'refuser' ? { note } : {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Erreur ${res.status}`);
      await load();
      router.refresh();
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue.');
    } finally {
      setPending(false);
    }
  };

  const conflicts = info.rows.filter((r) => r.conflict);

  return (
    <div className="lcs-promote lcs-promote--inline lcs-review">
      {modified && <span className="lcs-promote__hint">Sauvegardez vos corrections avant de décider.</span>}
      <button
        type="button"
        className="lcs-review__refuse"
        disabled={pending || modified}
        onClick={() => openModal(refuseSlug)}
      >
        Refuser
      </button>
      <button
        type="button"
        className="lcs-promote__btn"
        disabled={pending || modified || info.rows.length === 0}
        onClick={() => openModal(applySlug)}
      >
        {pending ? 'Enregistrement…' : 'Appliquer à la fiche'}
      </button>
      {error && (
        <span className="lcs-promote__error" role="alert">
          {error}
        </span>
      )}

      <ConfirmationModal
        modalSlug={applySlug}
        heading="Appliquer à la fiche ?"
        body={
          <div className="lcs-promote-modal-body">
            <p>
              Ces champs seront recopiés dans la fiche{' '}
              {info.musician ? <strong>{info.musician.name}</strong> : null} et publiés aussitôt :
            </p>
            <ul className="lcs-promote-modal-list">
              {info.rows.map((r) => (
                <li key={r.name}>{r.label}</li>
              ))}
            </ul>
            {conflicts.length > 0 && (
              <p className="lcs-review__warning">
                L’équipe a modifié {conflicts.map((r) => `« ${r.label} »`).join(', ')} depuis l’envoi :
                appliquer remplacera cette version par celle du membre.
              </p>
            )}
            <p>Le membre en sera prévenu par e-mail si l’envoi d’e-mails est configuré.</p>
          </div>
        }
        confirmLabel="Appliquer"
        confirmingLabel="Enregistrement…"
        cancelLabel="Annuler"
        onConfirm={async () => {
          closeModal(applySlug);
          await decide('appliquer');
        }}
      />

      <ConfirmationModal
        modalSlug={refuseSlug}
        heading="Refuser cette modification ?"
        body={
          <div className="lcs-promote-modal-body">
            <p>La fiche en ligne ne change pas. Le membre lira ce message dans son espace :</p>
            <textarea
              className="lcs-review__note"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Par exemple : la photo est trop sombre, pourriez-vous en envoyer une autre ?"
            />
          </div>
        }
        confirmLabel="Refuser"
        confirmingLabel="Enregistrement…"
        cancelLabel="Annuler"
        onConfirm={async () => {
          closeModal(refuseSlug);
          await decide('refuser');
        }}
      />
    </div>
  );
}

export default ProfileChangeReview;
