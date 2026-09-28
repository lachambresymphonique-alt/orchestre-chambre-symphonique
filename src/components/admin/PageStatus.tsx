'use client';

import './admin-sections.css';
import { useEffect, useRef, useState } from 'react';
import {
  ConfirmationModal,
  toast,
  useConfig,
  useDocumentInfo,
  useForm,
  useFormBackgroundProcessing,
  useFormFields,
  useFormModified,
  useFormProcessing,
  useModal,
} from '@payloadcms/ui';

/**
 * Statut d'une page libre, en tête de l'écran (à côté de « Publier ») : une
 * pastille qu'on ouvre pour passer de « Brouillon » à « En ligne » et
 * inversement, et l'état de l'enregistrement (« Enregistré à 13:38 »).
 *
 * - Publier : comme le bouton « Publier » de Payload.
 * - Retirer du site : la page repasse en brouillon avec son contenu actuel
 *   (le « Dépublier » de Payload, caché dans le menu ⋯, recharge le
 *   formulaire tel qu'il était à l'ouverture et perdrait la saisie en cours).
 * - Annuler les modifications : revient à la version en ligne.
 *
 * Sur le serveur d'essai (NEXT_PUBLIC_LCS_TEST_SERVER=1), qui écrit dans la
 * base du site, la publication est bloquée (voir aussi le hook de
 * collections/Pages.ts) : le site en ligne n'afficherait pas encore les
 * sections.
 */

type Status = 'draft' | 'published' | 'changed';

const LABELS: Record<Status, string> = {
  draft: 'Brouillon',
  published: 'En ligne',
  changed: 'En ligne · modifications à publier',
};

const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** Une heure lisible, ou null (Payload donne parfois une date invalide). */
function timeOf(value: unknown): string | null {
  const ms =
    value instanceof Date ? value.getTime() : typeof value === 'number' ? value : typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(ms) && ms > 0 ? timeFormat.format(ms) : null;
}

export function PageStatus() {
  const {
    id,
    collectionSlug,
    hasPublishedDoc,
    unpublishedVersionCount,
    lastUpdateTime,
    docPermissions,
    setHasPublishedDoc,
    setUnpublishedVersionCount,
    setMostRecentVersionIsAutosaved,
    incrementVersionCount,
  } = useDocumentInfo();
  const { submit, reset } = useForm();
  const modified = useFormModified();
  const saving = useFormBackgroundProcessing();
  const processing = useFormProcessing();
  const slug = useFormFields(([fields]) => fields.slug?.value);
  // Mis à jour à chaque enregistrement (valeur renvoyée par le serveur).
  const updatedAt = useFormFields(([fields]) => fields.updatedAt?.value);
  const { openModal, closeModal } = useModal();
  const {
    config: {
      routes: { api },
    },
  } = useConfig();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const testServer = process.env.NEXT_PUBLIC_LCS_TEST_SERVER === '1';
  const unpublishModal = `lcs-unpublish-${id}`;
  const revertModal = `lcs-revert-${id}`;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!id || !collectionSlug) return null;

  const status: Status = !hasPublishedDoc ? 'draft' : unpublishedVersionCount > 0 ? 'changed' : 'published';
  const address = typeof slug === 'string' && slug ? `/${slug}` : null;
  const canPublish = Boolean(docPermissions?.update) && !testServer;
  const docURL = `${api}/${collectionSlug}/${id}?depth=0&fallback-locale=null`;

  const savedAt = timeOf(updatedAt) ?? timeOf(lastUpdateTime);
  const saveState = saving || processing ? 'Enregistrement…' : modified ? 'Modifications en cours…' : savedAt ? `Enregistré à ${savedAt}` : 'Enregistré';

  const publish = async () => {
    setOpen(false);
    setBusy(true);
    try {
      const result = await submit({ action: docURL, method: 'PATCH', overrides: { _status: 'published' } });
      if (result) {
        setUnpublishedVersionCount(0);
        setMostRecentVersionIsAutosaved(false);
        setHasPublishedDoc(true);
      }
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    closeModal(unpublishModal);
    setBusy(true);
    try {
      const result = await submit({
        action: docURL,
        method: 'PATCH',
        overrides: { _status: 'draft' },
        skipValidation: true,
        disableSuccessStatus: true,
      });
      if (result) {
        setHasPublishedDoc(false);
        setUnpublishedVersionCount(0);
        setMostRecentVersionIsAutosaved(false);
        incrementVersionCount();
        toast.success('La page est retirée du site. Son contenu est gardé en brouillon.');
      }
    } finally {
      setBusy(false);
    }
  };

  const revert = async () => {
    closeModal(revertModal);
    setBusy(true);
    try {
      const published = await (await fetch(docURL, { credentials: 'include' })).json();
      const res = await fetch(docURL, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(published),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.errors?.[0]?.message ?? 'Impossible de revenir à la version en ligne.');
        return;
      }
      await reset(json.doc);
      setUnpublishedVersionCount(0);
      setMostRecentVersionIsAutosaved(false);
      incrementVersionCount();
      toast.success('Modifications annulées : la page est revenue à sa version en ligne.');
    } finally {
      setBusy(false);
    }
  };

  const choose = (next: 'draft' | 'published') => {
    if (next === 'published' && status === 'draft') void publish();
    if (next === 'draft' && status !== 'draft') {
      setOpen(false);
      openModal(unpublishModal);
    }
  };

  return (
    <div ref={rootRef} className="lcs-pagestatus">
      {/* Le statut et l'heure d'enregistrement de Payload font doublon avec cette pastille. */}
      <style>{`.doc-controls__list-item:has(.status), .doc-controls__list-item:has(.autosave) { display: none; }${
        testServer ? ' #action-save { display: none; }' : ''
      }`}</style>
      <span className={`lcs-pagestatus__save${modified || saving ? ' is-pending' : ''}`} aria-live="polite">
        {saveState}
      </span>
      <button
        type="button"
        className={`lcs-pagestatus__pill is-${status}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        disabled={busy}
      >
        <span className="lcs-pagestatus__dot" aria-hidden />
        {busy ? 'Un instant…' : LABELS[status]}
        <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="lcs-pagestatus__menu" role="dialog" aria-label="Statut de la page">
          <p className="lcs-pagestatus__heading">Statut de la page</p>
          <button type="button" className={`lcs-pagestatus__option${status === 'draft' ? ' is-current' : ''}`} onClick={() => choose('draft')} disabled={!canPublish && status !== 'draft'}>
            <span className="lcs-pagestatus__radio" aria-hidden />
            <span>
              <strong>Brouillon</strong>
              <small>Visible seulement ici, dans l’admin.</small>
            </span>
          </button>
          <button type="button" className={`lcs-pagestatus__option${status !== 'draft' ? ' is-current' : ''}`} onClick={() => choose('published')} disabled={!canPublish && status === 'draft'}>
            <span className="lcs-pagestatus__radio" aria-hidden />
            <span>
              <strong>En ligne</strong>
              <small>{address ? `Visible sur le site, à l’adresse ${address}` : 'Visible sur le site.'}</small>
            </span>
          </button>
          {status === 'changed' && (
            <div className="lcs-pagestatus__changes">
              <p>Des modifications ne sont pas encore en ligne.</p>
              <div>
                <button type="button" className="lcs-pagestatus__primary" onClick={() => void publish()} disabled={!canPublish}>
                  Publier les modifications
                </button>
                <button
                  type="button"
                  className="lcs-pagestatus__secondary"
                  onClick={() => {
                    setOpen(false);
                    openModal(revertModal);
                  }}
                  disabled={!canPublish}
                >
                  Annuler ces modifications
                </button>
              </div>
            </div>
          )}
          {testServer && (
            <p className="lcs-pagestatus__note">
              Serveur d’essai : publier et retirer du site sont désactivés tant que le constructeur de pages n’est pas en ligne. Vos modifications sont enregistrées en brouillon.
            </p>
          )}
          {address && status !== 'draft' && (
            <a className="lcs-pagestatus__link" href={address} target="_blank" rel="noopener noreferrer">
              Voir la page en ligne ↗
            </a>
          )}
        </div>
      )}
      <ConfirmationModal
        modalSlug={unpublishModal}
        heading="Retirer la page du site ?"
        body={`La page ne sera plus visible${address ? ` (l’adresse ${address} affichera « page introuvable »)` : ''}. Son contenu est gardé en brouillon : vous pourrez la republier quand vous voudrez.`}
        confirmLabel="Retirer du site"
        cancelLabel="Annuler"
        onConfirm={() => void unpublish()}
      />
      <ConfirmationModal
        modalSlug={revertModal}
        heading="Annuler les modifications ?"
        body="Les modifications faites depuis la dernière publication seront perdues : la page reviendra à sa version en ligne. L’historique des versions les garde."
        confirmLabel="Annuler les modifications"
        cancelLabel="Garder mes modifications"
        onConfirm={() => void revert()}
      />
    </div>
  );
}

export default PageStatus;
