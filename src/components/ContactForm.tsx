'use client';

import { useState, FormEvent, CSSProperties } from 'react';
import { Turnstile } from '@/components/Turnstile';
import { renderEmphasis } from '@/lib/emphasis';

/** Textes du formulaire, modifiables dans Pages → Page Contact → Formulaire. */
export type ContactFormCopy = {
  eyebrow?: string | null;
  title?: string | null;
  nameLabel?: string | null;
  namePlaceholder?: string | null;
  emailLabel?: string | null;
  emailPlaceholder?: string | null;
  subjectLabel?: string | null;
  subjectPlaceholder?: string | null;
  subjects?: { value?: string | null; label?: string | null }[] | null;
  messageLabel?: string | null;
  messagePlaceholder?: string | null;
  submitLabel?: string | null;
  successEyebrow?: string | null;
  successTitle?: string | null;
  successText?: string | null;
};

const DEFAULT_SUBJECTS = [
  { value: 'info', label: 'Demande d\'information' },
  { value: 'reservation', label: 'Réservation / Billetterie' },
  { value: 'mecenat', label: 'Mécénat / Partenariat' },
  { value: 'presse', label: 'Presse / Médias' },
  { value: 'programmation', label: 'Programmation / Booking' },
  { value: 'benevolat', label: 'Bénévolat' },
  { value: 'autre', label: 'Autre' },
];

type ContactFormProps = {
  /** Jeton signé côté serveur : prouve que la page a été chargée et mesure le temps de remplissage. */
  formToken: string;
  /** Clé publique Cloudflare Turnstile ; `null` quand le captcha n'est pas configuré. */
  turnstileSiteKey: string | null;
  copy?: ContactFormCopy | null;
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

export function ContactForm({ formToken, turnstileSiteKey, copy }: ContactFormProps) {
  const c = copy || {};
  const subjects = (Array.isArray(c.subjects) ? c.subjects : [])
    .map((s) => ({ value: (s?.value || '').trim(), label: (s?.label || '').trim() }))
    .filter((s) => s.value && s.label);
  const subjectOptions = subjects.length > 0 ? subjects : DEFAULT_SUBJECTS;
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
        <p className="eyebrow eyebrow--gold">{c.successEyebrow || 'Bien reçu'}</p>
        <h2 className="contact-form__title">{renderEmphasis(c.successTitle || '*Merci.*')}</h2>
        <hr className="velvet-rule long" />
        <p className="contact-form__success">
          {c.successText ||
            'Votre message vient d\'arriver. Nous vous répondrons personnellement, en général sous 48 heures.'}
        </p>
      </div>
    );
  }

  return (
    <div className="contact-form fade-in visible">
      <p className="eyebrow eyebrow--gold">{c.eyebrow || 'Écrivez-nous'}</p>
      <h2 className="contact-form__title">{renderEmphasis(c.title || '*Un mot,* une question')}</h2>
      <hr className="velvet-rule" />
      <form onSubmit={handleSubmit}>
        {/* Pot de miel : invisible pour un humain, rempli par les robots. */}
        <div style={HONEYPOT_STYLE} aria-hidden="true">
          <label htmlFor="website">Site web</label>
          <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="form-group">
          <label htmlFor="name">{c.nameLabel || 'Nom complet'}</label>
          <input type="text" id="name" name="name" placeholder={c.namePlaceholder || 'Votre nom et prénom'} required />
        </div>
        <div className="form-group">
          <label htmlFor="email">{c.emailLabel || 'Adresse e-mail'}</label>
          <input type="email" id="email" name="email" placeholder={c.emailPlaceholder || 'votre@email.fr'} required />
        </div>
        <div className="form-group">
          <label htmlFor="subject">{c.subjectLabel || 'Objet'}</label>
          <select id="subject" name="subject" required defaultValue="">
            <option value="" disabled>
              {c.subjectPlaceholder || 'Choisissez un sujet'}
            </option>
            {subjectOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="message">{c.messageLabel || 'Message'}</label>
          <textarea id="message" name="message" placeholder={c.messagePlaceholder || 'Votre message...'} required></textarea>
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
              : `${c.submitLabel || 'Envoyer le message'} →`}
        </button>
      </form>
    </div>
  );
}
