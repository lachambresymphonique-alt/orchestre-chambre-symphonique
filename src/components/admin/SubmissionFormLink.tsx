'use client';

import './admin-submission-link.css';
import { useEffect, useRef, useState } from 'react';
import { copyText } from '@/lib/clipboard';

type Props = {
  /**
   * Adresse du formulaire public. Complète (https://…) quand l'URL du site est
   * connue côté serveur, sinon le seul chemin : on la complète alors avec
   * l'adresse du site ouvert dans le navigateur.
   */
  url: string;
};

type CopyState = 'idle' | 'copied' | 'error';

/**
 * Lien du formulaire « Votre fiche sur le site » (/musiciens/contribuer), à
 * envoyer aux musiciens. Affiché en haut des listes Musiciens et Fiches reçues.
 * Les fiches envoyées arrivent en attente : rien n'est publié avant qu'un admin
 * clique « Ajouter à la liste de musiciens » sur la fiche.
 */
export function SubmissionFormLink({ url }: Props) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number | undefined>(undefined);
  const urlRef = useRef<HTMLSpanElement>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    const full = /^https?:\/\//.test(url) ? url : `${window.location.origin}${url}`;
    const ok = await copyText(full);
    setState(ok ? 'copied' : 'error');
    // Copie refusée : l'adresse est sélectionnée, il ne reste qu'à faire Cmd/Ctrl + C.
    if (!ok && urlRef.current) window.getSelection()?.selectAllChildren(urlRef.current);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), ok ? 2500 : 6000);
  };

  const shortUrl = url.replace(/^https?:\/\//, '');

  return (
    <div className="lcs-formlink" role="group" aria-label="Lien du formulaire à envoyer aux musiciens">
      <span className="lcs-formlink__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1 1" />
          <path d="M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1-1" />
        </svg>
      </span>
      <span className="lcs-formlink__text">
        <span className="lcs-formlink__label">Formulaire à envoyer aux musiciens</span>
        {/* Un clic sélectionne toute l'adresse, utile si la copie automatique échoue. */}
        <span ref={urlRef} className="lcs-formlink__url" title={url}>
          {shortUrl}
        </span>
      </span>
      <button
        type="button"
        className={`lcs-formlink__copy${state === 'copied' ? ' is-copied' : ''}`}
        onClick={copy}
      >
        {state === 'copied' ? (
          <>
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 8.5l3 3 7-7" />
            </svg>
            Lien copié
          </>
        ) : (
          'Copier le lien'
        )}
      </button>
      <a
        className="lcs-formlink__open"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title="Voir le formulaire tel que les musiciens le verront"
      >
        Ouvrir
      </a>
      <span className="lcs-formlink__status" role="status" aria-live="polite">
        {state === 'copied'
          ? 'Lien copié dans le presse-papiers.'
          : state === 'error'
            ? 'Copie automatique impossible : l’adresse est sélectionnée, copiez-la avec Cmd + C (Ctrl + C sous Windows).'
            : ''}
      </span>
    </div>
  );
}

export default SubmissionFormLink;
