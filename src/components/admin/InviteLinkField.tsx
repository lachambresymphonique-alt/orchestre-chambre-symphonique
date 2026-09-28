'use client';

import './admin-theme.css';
import './admin-member-invite.css';
import { useEffect, useState } from 'react';
import { useField } from '@payloadcms/ui';

/**
 * En tête d'un lien d'inscription : l'adresse à partager dans une discussion,
 * avec un bouton pour la copier. Le code n'existe qu'après le premier
 * enregistrement (collection member-invite-links).
 */
export function InviteLinkField() {
  const { value: code } = useField<string>({ path: 'code' });
  const { value: active } = useField<boolean>({ path: 'active' });
  const [copied, setCopied] = useState(false);
  // Adresse du site lue dans le navigateur, après l'affichage : le rendu serveur n'a pas `window`.
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  if (!code || !origin) {
    return (
      <div className="field-type lcs-invite-link">
        <p className="lcs-promote__hint">
          {code ? '…' : 'Enregistrez ce lien pour obtenir l’adresse à partager.'}
        </p>
      </div>
    );
  }

  const url = `${origin}/espace-membres/rejoindre/${code}`;
  return (
    <div className="field-type lcs-invite-link">
      <label className="field-label" htmlFor="lcs-invite-link-url">
        Adresse à partager
      </label>
      <div className="lcs-invite-link__row">
        <input
          id="lcs-invite-link-url"
          className="lcs-invite__input lcs-invite__link"
          type="text"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          type="button"
          className="lcs-invite__btn"
          onClick={async () => {
            await navigator.clipboard?.writeText(url).catch(() => undefined);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }}
        >
          {copied ? 'Copié ✓' : 'Copier'}
        </button>
      </div>
      <p className="lcs-promote__hint">
        {active === false
          ? 'Lien désactivé : il affiche « lien plus valable ». Cochez « Lien actif » pour le rouvrir.'
          : 'Collez-le dans la discussion du groupe. Chaque inscription arrive dans « Demandes d’accès », à valider.'}
      </p>
    </div>
  );
}

export default InviteLinkField;
