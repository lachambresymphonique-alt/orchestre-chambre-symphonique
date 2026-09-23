'use client';

import './admin-theme.css';
import './admin-share-form.css';
import { useEffect, useRef, useState } from 'react';
import { Button, Modal, useFormModified, useModal } from '@payloadcms/ui';
import { copyText } from '@/lib/clipboard';

/** Page publique où les musiciens remplissent leur fiche. */
const FORM_PATH = '/musiciens/contribuer';

/** Adresse publique du site, renseignée au déploiement (vide en local). */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().replace(/\/+$/, '');

const MODAL_SLUG = 'lcs-share-musician-form';

/** Base des tiroirs Payload : la modale se pose au même niveau. */
const MODAL_Z_INDEX = 100;

const MAIL_SUBJECT = 'Votre fiche sur le site de La Chambre Symphonique';

const mailBody = (url: string) =>
  [
    'Bonjour,',
    '',
    'Voici le lien pour compléter votre fiche de musicien sur le site de La Chambre Symphonique :',
    url,
    '',
    'Merci d’avance,',
    'La Chambre Symphonique',
  ].join('\n');

type CopyState = 'idle' | 'copied' | 'error';

/** Icône « maillon » de Payload, reprise telle quelle pour rester dans le ton. */
function LinkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="graphic link icon icon--link"
      fill="none"
      focusable="false"
      height="20"
      viewBox="0 0 20 20"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="stroke"
        d="M7.99999 13.3333H6.66666C5.78261 13.3333 4.93476 12.9821 4.30964 12.357C3.68452 11.7319 3.33333 10.884 3.33333 9.99999C3.33333 9.11593 3.68452 8.26809 4.30964 7.64297C4.93476 7.01785 5.78261 6.66666 6.66666 6.66666H7.99999M12 6.66666H13.3333C14.2174 6.66666 15.0652 7.01785 15.6904 7.64297C16.3155 8.26809 16.6667 9.11593 16.6667 9.99999C16.6667 10.884 16.3155 11.7319 15.6904 12.357C15.0652 12.9821 14.2174 13.3333 13.3333 13.3333H12M7.33333 9.99999H12.6667"
        strokeLinecap="square"
      />
    </svg>
  );
}

/**
 * Bouton « Partager le lien » — en-tête de la page Formulaire musiciens
 * (beforeDocumentControls du global `musician-form`).
 *
 * Ouvre une petite fenêtre qui montre l'adresse du formulaire public, la copie
 * dans le presse-papiers ou prépare un e-mail. Le même lien est affiché en haut
 * des listes Musiciens et Fiches reçues (voir SubmissionFormLink).
 */
export function ShareFormButton() {
  const { closeModal, isModalOpen, openModal } = useModal();
  const modified = useFormModified();
  const [url, setUrl] = useState(SITE_URL ? `${SITE_URL}${FORM_PATH}` : FORM_PATH);
  const [state, setState] = useState<CopyState>('idle');
  const urlRef = useRef<HTMLParagraphElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const open = () => {
    // Sans adresse publique configurée, on prend celle du site ouvert dans le
    // navigateur : l'admin et le site partagent le même domaine.
    if (!SITE_URL) setUrl(`${window.location.origin}${FORM_PATH}`);
    setState('idle');
    openModal(MODAL_SLUG);
  };

  const close = () => {
    window.clearTimeout(timer.current);
    setState('idle');
    closeModal(MODAL_SLUG);
  };

  const copy = async () => {
    const ok = await copyText(url);
    setState(ok ? 'copied' : 'error');
    // Copie refusée : l'adresse est sélectionnée, il ne reste qu'à faire Cmd + C.
    if (!ok && urlRef.current) window.getSelection()?.selectAllChildren(urlRef.current);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), ok ? 2500 : 6000);
  };

  const mailto = `mailto:?subject=${encodeURIComponent(MAIL_SUBJECT)}&body=${encodeURIComponent(
    mailBody(url),
  )}`;

  return (
    <>
      <Button
        buttonStyle="secondary"
        className="lcs-share__trigger"
        icon={<LinkIcon />}
        iconPosition="left"
        iconStyle="none"
        onClick={open}
        size="medium"
        tooltip="Le lien à envoyer aux musiciens"
        type="button"
      >
        Partager le lien
      </Button>

      {isModalOpen(MODAL_SLUG) && (
        <Modal className="lcs-share" closeOnBlur slug={MODAL_SLUG} style={{ zIndex: MODAL_Z_INDEX }}>
          <div className="lcs-share__wrapper">
            <div className="lcs-share__content">
              <h1>Partager le formulaire</h1>
              <p>
                Envoyez cette adresse aux musiciens : elle ouvre la page «&nbsp;Compléter ma
                fiche&nbsp;» telle qu’elle est enregistrée ici. Les fiches remplies arrivent dans
                «&nbsp;Fiches en attente&nbsp;» — rien n’est publié sans votre accord.
              </p>

              {modified && (
                <p className="lcs-share__warning">
                  Vos dernières modifications ne sont pas encore sauvegardées : les musiciens
                  verront le formulaire tel qu’il était avant.
                </p>
              )}

              {/* Un clic sélectionne toute l'adresse, utile si la copie automatique échoue. */}
              <p className="lcs-share__url" ref={urlRef}>
                {url}
              </p>

              <p className="lcs-share__open">
                <a href={url} rel="noopener noreferrer" target="_blank">
                  Ouvrir la page telle que les musiciens la verront
                </a>
              </p>

              <p className="lcs-share__status" role="status" aria-live="polite">
                {state === 'copied'
                  ? 'Lien copié dans le presse-papiers.'
                  : state === 'error'
                    ? 'Copie automatique impossible : l’adresse est sélectionnée, copiez-la avec Cmd + C (Ctrl + C sous Windows).'
                    : ''}
              </p>
            </div>

            <div className="lcs-share__controls">
              <Button onClick={copy} size="large" type="button">
                {state === 'copied' ? 'Lien copié' : 'Copier le lien'}
              </Button>
              <Button buttonStyle="secondary" el="anchor" size="large" url={mailto}>
                Envoyer par e-mail
              </Button>
              <Button buttonStyle="secondary" onClick={close} size="large" type="button">
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default ShareFormButton;
