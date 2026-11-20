'use client';

import './admin-theme.css';
import './admin-member-invite.css';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmationModal, useDocumentInfo, useModal } from '@payloadcms/ui';

/**
 * « Inviter sur Orchestra Manager », à côté de Sauvegarder sur la fiche d'un
 * musicien des pupitres. Demande à Orchestra Manager une invitation à l'espace
 * musicien et l'envoie par e-mail ; le lien reste aussi à copier. Absent tant
 * que la liaison n'est pas configurée, et sur les fiches hors pupitres.
 * Logique côté serveur : /api/orchestra-manager/acces, lib/orchestraManager.ts.
 */

type Access = { status: 'account' } | { status: 'invited'; expiresAt: string; link: string } | { status: 'none' };

type State = {
  configured: boolean;
  eligible: boolean;
  suggestedEmail?: string | null;
  access?: Access | null;
  error?: string | null;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export function OrchestraManagerButton() {
  const { id } = useDocumentInfo();
  const { openModal, closeModal } = useModal();
  const [state, setState] = useState<State | null>(null);
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ url: string | null; message: string } | null>(null);

  const askSlug = `om-invite-${id ?? 'new'}`;
  const doneSlug = `om-invite-done-${id ?? 'new'}`;

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/orchestra-manager/acces?musicianId=${encodeURIComponent(String(id))}`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const json = (await res.json()) as State;
      setState(json);
      setEmail((current) => current || json.suggestedEmail || '');
    } catch {
      // Sans état, rien ne s'affiche : la fiche reste utilisable.
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!id || !state?.configured || !state.eligible) return null;

  const access = state.access ?? null;
  const invite = async () => {
    setPending(true);
    setError('');
    try {
      const res = await fetch('/api/orchestra-manager/acces', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musicianId: id, email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Erreur ${res.status}`);
      await load();
      if (json.status === 'account') {
        setResult({ url: null, message: 'Cette personne a déjà son compte sur Orchestra Manager : rien à envoyer.' });
      } else {
        setResult({
          url: json.link,
          message: json.emailed
            ? `Le lien vient de partir par e-mail à ${email}. Vous pouvez aussi le lui transmettre dans une discussion.`
            : `L’e-mail n’a pas pu partir${json.mailError ? ` (${json.mailError})` : ''} : transmettez ce lien à ${email} vous-même.`,
        });
      }
      openModal(doneSlug);
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue.');
    } finally {
      setPending(false);
    }
  };

  const label =
    access?.status === 'account'
      ? 'Espace musicien Orchestra Manager actif'
      : access?.status === 'invited'
        ? `Invité·e sur Orchestra Manager · lien valable jusqu’au ${formatDate(access.expiresAt)}`
        : null;

  return (
    <div className="lcs-promote lcs-promote--inline lcs-invite">
      {label && <span className="lcs-invite__status">{label}</span>}
      {access?.status !== 'account' && (
        <button
          type="button"
          className="lcs-invite__btn"
          disabled={pending}
          onClick={() => {
            setError('');
            openModal(askSlug);
          }}
          title="Ouvre l’espace musicien d’Orchestra Manager (sessions, covoiturage, remboursements, partitions)"
        >
          {pending ? 'Envoi…' : access?.status === 'invited' ? 'Renvoyer l’invitation Orchestra Manager' : 'Inviter sur Orchestra Manager'}
        </button>
      )}
      {(error || state.error) && (
        <span className="lcs-promote__error" role="alert">
          {error || state.error}
        </span>
      )}

      <ConfirmationModal
        modalSlug={askSlug}
        heading="Inviter sur Orchestra Manager ?"
        body={
          <div className="lcs-promote-modal-body">
            <label className="lcs-invite__label" htmlFor={`${askSlug}-email`}>
              Adresse e-mail
            </label>
            <input
              id={`${askSlug}-email`}
              className="lcs-invite__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@exemple.fr"
              autoComplete="off"
            />
            {state.suggestedEmail && email === state.suggestedEmail && (
              <p className="lcs-invite__hint">Adresse reprise de la dernière fiche reçue à ce nom.</p>
            )}
            <ul className="lcs-promote-modal-list">
              <li>Orchestra Manager retrouve sa fiche par cette adresse, ou la crée.</li>
              <li>Un lien, valable 14 jours, part à cette adresse ; vous pourrez aussi le copier.</li>
              <li>La personne y choisit son identifiant et son mot de passe, puis arrive dans son espace musicien.</li>
            </ul>
          </div>
        }
        confirmLabel="Inviter"
        confirmingLabel="Envoi…"
        cancelLabel="Annuler"
        onConfirm={async () => {
          closeModal(askSlug);
          await invite();
        }}
      />

      <ConfirmationModal
        modalSlug={doneSlug}
        heading="Invitation Orchestra Manager"
        body={
          <div className="lcs-promote-modal-body">
            <p>{result?.message}</p>
            {result?.url && (
              <input
                className="lcs-invite__input lcs-invite__link"
                type="text"
                readOnly
                value={result.url}
                onFocus={(e) => e.currentTarget.select()}
              />
            )}
          </div>
        }
        confirmLabel={result?.url ? 'Copier le lien' : 'Fermer'}
        cancelLabel="Fermer"
        onConfirm={async () => {
          if (result?.url) await navigator.clipboard?.writeText(result.url).catch(() => undefined);
          closeModal(doneSlug);
        }}
      />
    </div>
  );
}

export default OrchestraManagerButton;
