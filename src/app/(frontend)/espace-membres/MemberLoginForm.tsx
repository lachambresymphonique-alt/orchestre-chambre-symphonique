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
  formToken: string;
  /** Clé publique Cloudflare Turnstile ; `null` quand le captcha n'est pas configuré. */
  turnstileSiteKey: string | null;
};

/** Demande d'un lien de connexion à l'espace membres (POST /api/membres/lien). */
export function MemberLoginForm({ formToken, turnstileSiteKey }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const waitingForCaptcha = Boolean(turnstileSiteKey) && !turnstileToken;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus('sending');
    setMessage('');
    try {
      const res = await fetch('/api/membres/lien', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: (form.elements.namedItem('email') as HTMLInputElement).value,
          website: (form.elements.namedItem('website') as HTMLInputElement).value,
          formToken,
          turnstileToken,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Une erreur est survenue. Veuillez réessayer.');
      setMessage(json?.message || '');
      setStatus('sent');
    } catch (err) {
      setMessage((err as Error).message);
      setStatus('error');
      // Un jeton Turnstile ne sert qu'une fois : on remonte le widget.
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
    }
  }

  if (status === 'sent') {
    return (
      <div className="contact-form contact-form--success">
        <p className="eyebrow eyebrow--gold">Lien envoyé</p>
        <h2 className="contact-form__title">
          <em>Regardez</em> vos e-mails.
        </h2>
        <hr className="velvet-rule long" />
        <p className="contact-form__success">{message}</p>
      </div>
    );
  }

  return (
    <div className="contact-form">
      <p className="eyebrow eyebrow--gold">Connexion</p>
      <h2 className="contact-form__title">
        <em>Recevoir</em> un lien
      </h2>
      <hr className="velvet-rule" />
      <p className="member-area__text">
        Saisissez l’adresse à laquelle l’orchestre vous a invité·e : nous vous envoyons un lien
        de connexion. Pas de mot de passe à retenir.
      </p>
      <form onSubmit={handleSubmit}>
        <div style={HONEYPOT_STYLE} aria-hidden="true">
          <label htmlFor="website">Site web</label>
          <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <div className="form-group">
          <label htmlFor="email">Adresse e-mail</label>
          <input type="email" id="email" name="email" placeholder="votre@email.fr" autoComplete="email" required />
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
          {status === 'sending' ? 'Envoi…' : waitingForCaptcha ? 'Vérification…' : 'Recevoir mon lien →'}
        </button>
      </form>
    </div>
  );
}
