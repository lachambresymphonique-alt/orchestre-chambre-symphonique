'use client';

import './admin-theme.css';
import './admin-member-invite.css';
import './admin-profile-change.css';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmationModal, useDocumentInfo, useModal } from '@payloadcms/ui';

/**
 * « Refuser » et « Accepter », à côté de Sauvegarder sur une demande d'accès.
 * Accepter relie la personne à une fiche existante (repérée par son nom) ou
 * crée sa fiche, puis affiche le lien de connexion à copier. Logique côté
 * serveur : /api/membres/demandes/:id/{accepter,refuser}.
 */

type Candidate = { id: number | string; name: string; role: string; section: string; exact: boolean; accountEmail: string | null };
type Info = {
  status: 'nouvelle' | 'acceptee' | 'refusee';
  decidedAt: string | null;
  name: string;
  email: string;
  roleLabel: string;
  pupitreLabel: string;
  candidates: Candidate[];
  suggestion: { name: string; role: string };
};

const NEW = 'nouvelle-fiche';
const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

export function MemberRequestReview() {
  const router = useRouter();
  const { id, lastUpdateTime } = useDocumentInfo();
  const { openModal, closeModal } = useModal();
  const [info, setInfo] = useState<Info | null>(null);
  const [choice, setChoice] = useState<string>(NEW);
  const [ficheName, setFicheName] = useState('');
  const [ficheRole, setFicheRole] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ link: string; text: string; emailed: boolean } | null>(null);

  const acceptSlug = `member-request-accept-${id ?? 'new'}`;
  const refuseSlug = `member-request-refuse-${id ?? 'new'}`;
  const linkSlug = `member-request-link-${id ?? 'new'}`;

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/membres/demandes/${id}`, { credentials: 'include' });
      if (!res.ok) return;
      const json = (await res.json()) as Info;
      setInfo(json);
      const exact = json.candidates.find((c) => c.exact);
      setChoice(exact ? String(exact.id) : NEW);
      setFicheName(json.suggestion.name);
      setFicheRole(json.suggestion.role);
    } catch {
      // L'état se rechargera à la prochaine sauvegarde.
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load, lastUpdateTime]);

  if (!id || !info) return null;

  if (info.status !== 'nouvelle') {
    return (
      <div className="lcs-promote lcs-promote--inline">
        <span className="lcs-promote__info">
          {info.status === 'acceptee' ? 'Acceptée' : 'Refusée'}
          {info.decidedAt ? ` le ${formatDate(info.decidedAt)}` : ''}
        </span>
      </div>
    );
  }

  const decide = async (action: 'accepter' | 'refuser') => {
    setPending(true);
    setError('');
    try {
      const body =
        action === 'refuser'
          ? {}
          : choice === NEW
            ? { newFiche: { name: ficheName, role: ficheRole } }
            : { musicianId: choice };
      const res = await fetch(`/api/membres/demandes/${id}/${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Erreur ${res.status}`);
      if (action === 'accepter') {
        setResult({
          link: json.link,
          emailed: Boolean(json.emailed),
          text: json.emailed
            ? `Le lien de connexion vient de partir par e-mail à ${json.email}.`
            : json.mailError
              ? `L’e-mail n’a pas pu partir (${json.mailError}).`
              : 'L’envoi d’e-mails n’est pas configuré sur le site.',
        });
        openModal(linkSlug);
      }
      await load();
      router.refresh();
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="lcs-promote lcs-promote--inline lcs-review">
      <button type="button" className="lcs-review__refuse" disabled={pending} onClick={() => openModal(refuseSlug)}>
        Refuser
      </button>
      <button type="button" className="lcs-promote__btn" disabled={pending} onClick={() => openModal(acceptSlug)}>
        {pending ? 'Enregistrement…' : 'Accepter…'}
      </button>
      {error && (
        <span className="lcs-promote__error" role="alert">
          {error}
        </span>
      )}

      <ConfirmationModal
        modalSlug={acceptSlug}
        heading={`Accepter ${info.name} ?`}
        body={
          <div className="lcs-promote-modal-body">
            <p>
              {info.roleLabel}
              {info.pupitreLabel ? ` · ${info.pupitreLabel}` : ''} · {info.email}
            </p>
            <fieldset className="lcs-request__choices">
              <legend>Fiche de cette personne</legend>
              {info.candidates.map((c) => (
                <label key={c.id} className="lcs-request__choice">
                  <input type="radio" name="fiche" value={String(c.id)} checked={choice === String(c.id)} onChange={() => setChoice(String(c.id))} />
                  <span>
                    <strong>{c.name}</strong> — {c.role}
                    {c.exact ? ' · même nom' : ''}
                    {c.accountEmail ? ` · accès déjà ouvert (${c.accountEmail})` : ''}
                  </span>
                </label>
              ))}
              <label className="lcs-request__choice">
                <input type="radio" name="fiche" value={NEW} checked={choice === NEW} onChange={() => setChoice(NEW)} />
                <span>
                  <strong>Créer une nouvelle fiche</strong>
                  {info.candidates.length === 0 ? ' (aucune fiche à ce nom)' : ''}
                </span>
              </label>
            </fieldset>
            {choice === NEW && (
              <div className="lcs-request__new">
                <label className="lcs-invite__label" htmlFor={`${acceptSlug}-name`}>
                  Nom affiché
                </label>
                <input id={`${acceptSlug}-name`} className="lcs-invite__input" value={ficheName} onChange={(e) => setFicheName(e.target.value)} />
                <label className="lcs-invite__label" htmlFor={`${acceptSlug}-role`}>
                  Rôle affiché
                </label>
                <input id={`${acceptSlug}-role`} className="lcs-invite__input" value={ficheRole} onChange={(e) => setFicheRole(e.target.value)} />
                <p className="lcs-invite__hint">La fiche sera visible aussitôt sur la page Musiciens ; complétez-la ensuite.</p>
              </div>
            )}
            <ul className="lcs-promote-modal-list">
              <li>Son pupitre est ajouté à la fiche, pour les partitions.</li>
              <li>Un lien de connexion est émis ; vous pourrez le copier pour une discussion.</li>
            </ul>
          </div>
        }
        confirmLabel="Accepter"
        confirmingLabel="Enregistrement…"
        cancelLabel="Annuler"
        onConfirm={async () => {
          closeModal(acceptSlug);
          await decide('accepter');
        }}
      />

      <ConfirmationModal
        modalSlug={refuseSlug}
        heading="Refuser cette demande ?"
        body={
          <div className="lcs-promote-modal-body">
            <p>Aucun accès n’est ouvert. La personne en est prévenue par e-mail si l’envoi d’e-mails est configuré.</p>
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

      <ConfirmationModal
        modalSlug={linkSlug}
        heading="Lien de connexion"
        body={
          <div className="lcs-promote-modal-body">
            <p>
              {result?.text} {result?.emailed ? 'Vous pouvez aussi l’envoyer' : 'Envoyez-le'} dans une discussion : il est valable 14 jours, ne sert
              qu’une fois et n’ouvre que l’espace de cette personne.
            </p>
            <input
              className="lcs-invite__input lcs-invite__link"
              type="text"
              readOnly
              value={result?.link ?? ''}
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        }
        confirmLabel="Copier le lien"
        cancelLabel="Fermer"
        onConfirm={async () => {
          if (result?.link) await navigator.clipboard?.writeText(result.link).catch(() => undefined);
          closeModal(linkSlug);
        }}
      />
    </div>
  );
}

export default MemberRequestReview;
