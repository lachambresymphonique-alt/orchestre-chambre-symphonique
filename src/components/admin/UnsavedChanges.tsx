'use client';

import './admin-unsaved.css';
import { useCallback, useEffect } from 'react';
import {
  Button,
  ConfirmationModal,
  useDocumentInfo,
  useForm,
  useFormModified,
  useModal,
} from '@payloadcms/ui';

/**
 * Signale une fiche modifiée mais pas encore sauvegardée, sur tous les écrans
 * d'édition (branché pour chaque collection et page dans `payload.config.ts`,
 * emplacement `beforeDocumentControls`, à gauche de « Sauvegarder »).
 *
 * - Pastille « Modifications non enregistrées » et bouton « Annuler les
 *   modifications » (remet la fiche dans son dernier état sauvegardé).
 * - Prévient l'aperçu en direct (iframe) par `postMessage` : il affiche alors
 *   son propre bandeau et bloque ses liens (voir `useLivePreviewSync`).
 *
 * Les liens de l'admin, eux, restent gardés par Payload (fenêtre « Quitter
 * sans sauvegarder »).
 */

export const UNSAVED_MESSAGE = 'lcs:unsaved';
export const UNSAVED_QUERY = 'lcs:unsaved?';

const modalSlug = 'lcs-discard-changes';

function tellPreviews(unsaved: boolean) {
  document.querySelectorAll('iframe').forEach((frame) => {
    try {
      frame.contentWindow?.postMessage({ type: UNSAVED_MESSAGE, unsaved }, window.location.origin);
    } catch {
      // Aperçu sur une autre origine : rien à faire.
    }
  });
}

export function UnsavedChanges() {
  const modified = useFormModified();
  const { reset } = useForm();
  const { data, id, globalSlug } = useDocumentInfo();
  const { openModal } = useModal();
  // Une fiche en cours de création n'a pas d'état sauvegardé auquel revenir.
  const canDiscard = Boolean(id || globalSlug);

  useEffect(() => {
    tellPreviews(modified);
    document.body.classList.toggle('lcs-has-unsaved', modified);
  }, [modified]);

  // L'aperçu (re)chargé demande l'état courant.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === UNSAVED_QUERY) tellPreviews(modified);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [modified]);

  useEffect(
    () => () => {
      document.body.classList.remove('lcs-has-unsaved');
      tellPreviews(false);
    },
    [],
  );

  const discard = useCallback(async () => {
    await reset(data ?? {});
  }, [reset, data]);

  if (!modified) return null;

  return (
    <div className="lcs-unsaved" role="status" aria-live="polite">
      <span className="lcs-unsaved__pill">
        <span className="lcs-unsaved__dot" aria-hidden />
        Modifications non enregistrées
      </span>
      {canDiscard && (
        <>
          <Button
            buttonStyle="secondary"
            className="lcs-unsaved__discard"
            onClick={() => openModal(modalSlug)}
            size="medium"
          >
            Annuler les modifications
          </Button>
          <ConfirmationModal
            body="Tout ce que vous avez modifié depuis la dernière sauvegarde sera perdu, et la fiche reviendra à sa version enregistrée."
            confirmLabel="Annuler les modifications"
            cancelLabel="Continuer à modifier"
            heading="Annuler les modifications ?"
            modalSlug={modalSlug}
            onConfirm={discard}
          />
        </>
      )}
    </div>
  );
}
