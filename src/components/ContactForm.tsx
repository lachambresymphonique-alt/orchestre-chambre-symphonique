'use client';

import { useState, FormEvent, CSSProperties } from 'react';
import { Turnstile } from '@/components/Turnstile';

type ContactFormProps = {
  /** Jeton signé côté serveur : prouve que la page a été chargée et mesure le temps de remplissage. */
  formToken: string;
  /** Clé publique Cloudflare Turnstile ; `null` quand le captcha n'est pas configuré. */
  turnstileSiteKey: string | null;
};

// Pot de miel : hors écran (pas `display: none`, que certains robots détectent),
// inaccessible au clavier et aux lecteurs d'écran.
const HONEYPOT_STYLE: CSSProperties = {
  position: 'absolute',
  left: '-10000px',
  top: 'auto',
  width: 1,
  height: 1,
  overflow: 'hidden',
};

export function ContactForm({ formToken, turnstileSiteKey }: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileFailed, setTurnstileFailed] = useState(false);
  // Un jeton Turnstile ne sert qu'une fois : on remonte le widget après chaque envoi.
  const [widgetKey, setWidgetKey] = useState(0);

  const captchaRequired = Boolean(turnstileSiteKey);
  const waitingForCaptcha = captchaRequired && !turnstileToken;

  const renewCaptcha = () => {
    setTurnstileToken(null);
    setWidgetKey((k) => k + 1);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (waitingForCaptcha) return;
    setStatus('sending');
    setErrorMsg('');

    const form = e.target as HTMLFormElement;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      subject: (form.elements.namedItem('subject') as HTMLSelectElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
      website: (form.elements.namedItem('website') as HTMLInputElement).value,
      formToken,
      turnstileToken,
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Erreur lors de l\'envoi.');
      }

      setStatus('success');
      form.reset();
      renewCaptcha();
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
      setStatus('error');
      renewCaptcha();
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  if (status === 'success') {
    return (
      <div className="contact-form contact-form--success">
        <p className="eyebrow eyebrow--gold">Bien reçu</p>
        <h2 className="contact-form__title">
          <em>Merci.</em>
        </h2>
        <hr className="velvet-rule long" />
        <p className="contact-form__success">
          Votre message vient d'arriver. Nous vous répondrons personnellement,
          en général sous 48 heures.
        </p>
      </div>
    );
  }

  return (
    <div className="contact-form fade-in visible">
      <p className="eyebrow eyebrow--gold">Écrivez-nous</p>
      <h2 className="contact-form__title">
        <em>Un mot,</em> une question
      </h2>
      <hr className="velvet-rule" />
      <form onSubmit={handleSubmit}>
        {/* Pot de miel : invisible pour un humain, rempli par les robots. */}
        <div style={HONEYPOT_STYLE} aria-hidden="true">
          <label htmlFor="website">Site web</label>
          <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="form-group">
          <label htmlFor="name">Nom complet</label>
          <input type="text" id="name" name="name" placeholder="Votre nom et prénom" required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Adresse e-mail</label>
          <input type="email" id="email" name="email" placeholder="votre@email.fr" required />
        </div>
        <div className="form-group">
          <label htmlFor="subject">Objet</label>
          <select id="subject" name="subject" required defaultValue="">
            <option value="" disabled>Choisissez un sujet</option>
            <option value="info">Demande d&apos;information</option>
            <option value="reservation">Réservation / Billetterie</option>
            <option value="mecenat">Mécénat / Partenariat</option>
            <option value="presse">Presse / Médias</option>
            <option value="programmation">Programmation / Booking</option>
            <option value="benevolat">Bénévolat</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea id="message" name="message" placeholder="Votre message..." required></textarea>
        </div>

        {turnstileSiteKey && (
          <div className="form-group">
            <Turnstile
              key={widgetKey}
              siteKey={turnstileSiteKey}
              onToken={(token) => {
                setTurnstileToken(token);
                if (token) setTurnstileFailed(false);
              }}
              onError={() => setTurnstileFailed(true)}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--rose-mute)', marginTop: '0.5rem' }}>
              Formulaire protégé par Cloudflare Turnstile.
            </p>
          </div>
        )}

        {turnstileFailed && (
          <p className="contact-form__error" role="alert">
            <em>La vérification anti-robot n&apos;a pas pu se charger.</em> Rechargez la page
            ou réessayez plus tard.
          </p>
        )}

        {status === 'error' && (
          <p className="contact-form__error" role="alert">
            <em>{errorMsg || 'Une erreur est survenue.'}</em> Merci de réessayer.
          </p>
        )}

        <button
          type="submit"
          className="btn-filled"
          disabled={status === 'sending' || waitingForCaptcha}
        >
          {status === 'sending'
            ? 'Envoi…'
            : waitingForCaptcha
              ? 'Vérification…'
              : 'Envoyer le message →'}
        </button>
      </form>
    </div>
  );
}
