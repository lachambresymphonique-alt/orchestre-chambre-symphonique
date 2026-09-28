'use client';

import './admin-theme.css';
import './admin-member-invite.css';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmationModal, useDocumentInfo, useModal } from '@payloadcms/ui';

/**
 * « Inviter à l'espace membres », à côté de Sauvegarder sur la fiche d'un
 * musicien. Crée ou met à jour l'accès (collection Accès membres) et émet un
 * lien de connexion : envoyé par e-mail si le SMTP est configuré, sinon
 * affiché ici pour être transmis à la main. Logique côté serveur :
 * /api/membres/invitation.
 */

type Account = {
  email: string;
  status: 'invite' | 'actif' | 'desactive';
  invitedAt: string | null;
  lastLoginAt: string | null;
};

type State = { account: Account | null; suggestedEmail: string | null; mailConfigured: boolean };

const BUTTON_LABELS: Record<Account['status'] | 'none', string> = {
  none: 'Inviter à l’espace membres',
  invite: 'Renvoyer l’invitation',
  actif: 'Envoyer un lien de connexion',
  desactive: 'Réinviter',
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

function statusLabel(account: Account | null): string | null {
  if (!account) return null;
  if (account.status === 'actif') {
    return account.lastLoginAt
      ? `Espace membres actif · connexion le ${formatDate(account.lastLoginAt)}`
      : 'Espace membres actif';
  }
  if (account.status === 'invite') return `Invité·e le ${formatDate(account.invitedAt)}`;
  return 'Accès désactivé';
}

export function InviteMemberButton() {
  const { id } = useDocumentInfo();
  const { openModal, closeModal } = useModal();
  const [state, setState] = useState<State | null>(null);
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [link, setLink] = useState<{ url: string; reason: string; emailed: boolean } | null>(null);

  const inviteSlug = `invite-member-${id ?? 'new'}`;
  const linkSlug = `invite-member-link-${id ?? 'new'}`;

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/membres/invitation?musicianId=${encodeURIComponent(String(id))}`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const json = (await res.json()) as State;
      setState(json);
      setEmail(json.account?.email || json.suggestedEmail || '');
    } catch {
      // Sans état, le bouton reste utilisable : l'adresse sera saisie à la main.
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!id) return null;

  const invite = async () => {
    setPending(true);
    setError('');
    setSentTo('');
    try {
      const res = await fetch('/api/membres/invitation', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musicianId: id, email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Erreur ${res.status}`);
      await load();
      // Le lien s'affiche toujours : on peut aussi le partager dans une discussion.
      if (json.emailed) setSentTo(json.account?.email || email);
      setLink({
        url: json.link,
        emailed: Boolean(json.emailed),
        reason: json.emailed
          ? `Le lien vient de partir par e-mail à ${json.account?.email || email}.`
          : json.mailError
            ? `L’e-mail n’a pas pu partir (${json.mailError}).`
            : 'L’envoi d’e-mails n’est pas configuré sur le site.',
      });
      openModal(linkSlug);
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue.');
    } finally {
      setPending(false);
    }
  };

  const status = state?.account?.status ?? 'none';
  const label = statusLabel(state?.account ?? null);

  return (
    <div className="lcs-promote lcs-promote--inline lcs-invite">
      {label && <span className="lcs-invite__status">{label}</span>}
      <button
        type="button"
        className="lcs-invite__btn"
        disabled={pending}
        onClick={() => {
          setError('');
          openModal(inviteSlug);
        }}
        title="Donne accès à l’espace membres du site, sans aucun accès à l’administration"
      >
        {pending ? 'Envoi…' : BUTTON_LABELS[status]}
      </button>
      {sentTo && <span className="lcs-promote__info">Lien envoyé à {sentTo}</span>}
      {error && (
        <span className="lcs-promote__error" role="alert">
          {error}
        </span>
      )}

      <ConfirmationModal
        modalSlug={inviteSlug}
        heading={status === 'none' ? 'Inviter à l’espace membres ?' : BUTTON_LABELS[status] + ' ?'}
        body={
          <div className="lcs-promote-modal-body">
            <label className="lcs-invite__label" htmlFor={`${inviteSlug}-email`}>
              Adresse e-mail
            </label>
            <input
              id={`${inviteSlug}-email`}
              className="lcs-invite__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@exemple.fr"
              autoComplete="off"
            />
            {!state?.account && state?.suggestedEmail && email === state.suggestedEmail && (
              <p className="lcs-invite__hint">Adresse reprise de la dernière fiche reçue à ce nom.</p>
            )}
            <ul className="lcs-promote-modal-list">
              <li>
                {state?.mailConfigured === false
                  ? 'L’envoi d’e-mails n’est pas configuré : vous obtiendrez un lien à transmettre vous-même.'
                  : 'Un lien de connexion, valable 14 jours, part à cette adresse ; vous pourrez aussi le copier.'}
              </li>
              <li>
                La personne retrouve sa fiche sur <em>/espace-membres</em>, sans mot de passe.
              </li>
              <li>Ce compte ne donne aucun accès à l’administration.</li>
            </ul>
          </div>
        }
        confirmLabel={status === 'none' ? 'Inviter' : 'Envoyer'}
        confirmingLabel="Envoi…"
        cancelLabel="Annuler"
        onConfirm={async () => {
          closeModal(inviteSlug);
          await invite();
        }}
      />

      <ConfirmationModal
        modalSlug={linkSlug}
        heading="Lien de connexion"
        body={
          <div className="lcs-promote-modal-body">
            <p>
              {link?.reason} {link?.emailed ? 'Vous pouvez aussi l’envoyer' : 'Envoyez-le'} à <strong>{email}</strong> dans une
              discussion (WhatsApp, Messenger…). Il est valable 14 jours, ne sert qu’une fois et
              n’ouvre que l’espace de cette personne.
            </p>
            <input
              className="lcs-invite__input lcs-invite__link"
              type="text"
              readOnly
              value={link?.url ?? ''}
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        }
        confirmLabel="Copier le lien"
        cancelLabel="Fermer"
        onConfirm={async () => {
          if (link?.url) await navigator.clipboard?.writeText(link.url).catch(() => undefined);
          closeModal(linkSlug);
        }}
      />
    </div>
  );
}

export default InviteMemberButton;
