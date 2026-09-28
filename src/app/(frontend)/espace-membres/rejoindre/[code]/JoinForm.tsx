'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { Turnstile } from '@/components/Turnstile';

/** Pot de miel : hors écran pour un humain, rempli par les robots. */
const HONEYPOT_STYLE: CSSProperties = {
  position: 'absolute',
  left: '-10000px',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
};

type Props = {
  code: string;
  role: 'musicien' | 'technique';
  pupitres: { value: string; label: string }[];
  formToken: string;
  turnstileSiteKey: string | null;
};

/** Demande d'accès depuis un lien d'inscription (POST /api/membres/demande). */
export function JoinForm({ code, role, pupitres, formToken, turnstileSiteKey }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const waitingForCaptcha = Boolean(turnstileSiteKey) && !turnstileToken;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setStatus('sending');
    setMessage('');
    try {
      const res = await fetch('/api/membres/demande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          firstName: f.get('firstName'),
          lastName: f.get('lastName'),
          email: f.get('email'),
          pupitre: f.get('pupitre'),
          message: f.get('message'),
          website: f.get('website'),
          formToken,
          turnstileToken,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Une erreur est survenue. Veuillez réessayer.');
      setStatus('sent');
    } catch (err) {
      setMessage((err as Error).message);
      setStatus('error');
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
    }
  }

  if (status === 'sent') {
    return (
      <div className="contact-form contact-form--success">
        <p className="eyebrow eyebrow--gold">Demande envoyée</p>
        <h2 className="contact-form__title">
          <em>Merci.</em>
        </h2>
        <hr className="velvet-rule long" />
        <p className="contact-form__success">
          L’équipe va vérifier votre demande. Vous recevrez ensuite votre lien de connexion, par e-mail
          ou dans la discussion de l’orchestre.
        </p>
      </div>
    );
  }

  return (
    <div className="contact-form">
      <p className="eyebrow eyebrow--gold">Inscription</p>
      <h2 className="contact-form__title">
        <em>Demander</em> un accès
      </h2>
      <hr className="velvet-rule" />
      <p className="member-area__text">
        Vous retrouverez votre fiche{role === 'musicien' ? ' et les partitions de votre pupitre' : ' et les documents de l’équipe technique'}.
        L’équipe valide chaque demande avant d’ouvrir l’accès.
      </p>
      <form onSubmit={handleSubmit}>
        <div style={HONEYPOT_STYLE} aria-hidden="true">
          <label htmlFor="website">Site web</label>
          <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <div className="form-group">
          <label htmlFor="join-firstName">Prénom</label>
          <input id="join-firstName" name="firstName" type="text" autoComplete="given-name" maxLength={80} required />
        </div>
        <div className="form-group">
          <label htmlFor="join-lastName">Nom</label>
          <input id="join-lastName" name="lastName" type="text" autoComplete="family-name" maxLength={80} required />
        </div>
        <div className="form-group">
          <label htmlFor="join-email">Adresse e-mail</label>
          <input id="join-email" name="email" type="email" autoComplete="email" placeholder="votre@email.fr" required />
        </div>
        {role === 'musicien' && (
          <div className="form-group">
            <label htmlFor="join-pupitre">Pupitre</label>
            <select id="join-pupitre" name="pupitre" required defaultValue="">
              <option value="" disabled>
                Choisissez votre pupitre
              </option>
              {pupitres.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="form-group">
          <label htmlFor="join-message">Message (facultatif)</label>
          <textarea id="join-message" name="message" rows={3} maxLength={1000} placeholder="Par exemple : je joue aussi du piccolo." />
        </div>
        {turnstileSiteKey && (
          <div className="form-group">
            <Turnstile key={turnstileKey} siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
          </div>
        )}
        {status === 'error' && (
          <p className="contact-form__error" role="alert">
            {message}
          </p>
        )}
        <button type="submit" className="btn-filled" disabled={status === 'sending' || waitingForCaptcha}>
          {status === 'sending' ? 'Envoi…' : waitingForCaptcha ? 'Vérification…' : 'Envoyer ma demande →'}
        </button>
      </form>
    </div>
  );
}
