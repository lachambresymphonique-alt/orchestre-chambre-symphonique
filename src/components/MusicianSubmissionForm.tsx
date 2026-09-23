'use client';

import { useState, FormEvent, useRef, ChangeEvent, CSSProperties } from 'react';
import { Turnstile } from '@/components/Turnstile';
import {
  allQuestions,
  layoutQuestions,
  type ResolvedMusicianForm,
  type ResolvedQuestion,
} from '@/lib/musicianForm';

/**
 * Formulaire « Compléter ma fiche musicien ».
 *
 * Les questions, leur ordre et leurs libellés viennent du global
 * « Formulaire musiciens » (Pages → Formulaire musiciens), résolus côté
 * serveur par `resolveMusicianForm`. Ce composant ne connaît que la forme
 * résolue : il affiche ce qu'on lui donne.
 */

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

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];

const INPUT_TYPES: Record<string, string> = {
  text: 'text',
  email: 'email',
  tel: 'tel',
  url: 'url',
};

type MusicianSubmissionFormProps = {
  /** Jeton signé côté serveur : prouve que la page a été chargée et mesure le temps de remplissage. */
  formToken: string;
  /** Clé publique Cloudflare Turnstile ; `null` quand le captcha n'est pas configuré. */
  turnstileSiteKey: string | null;
  /** Questions à poser, telles que réglées dans l'admin. */
  form: ResolvedMusicianForm;
};

export function MusicianSubmissionForm({ formToken, turnstileSiteKey, form }: MusicianSubmissionFormProps) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [section, setSection] = useState<string>('');
  const [photoName, setPhotoName] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileFailed, setTurnstileFailed] = useState(false);
  // Un jeton Turnstile ne sert qu'une fois : on remonte le widget après un envoi refusé.
  const [widgetKey, setWidgetKey] = useState(0);

  const captchaRequired = Boolean(turnstileSiteKey);
  const waitingForCaptcha = captchaRequired && !turnstileToken;

  const renewCaptcha = () => {
    setTurnstileToken(null);
    setWidgetKey((k) => k + 1);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoName(file ? file.name : '');
  };

  /** Première question obligatoire restée vide, pour le signaler avant l'envoi. */
  const firstMissing = (data: FormData): ResolvedQuestion | null => {
    for (const question of allQuestions(form)) {
      if (!question.required) continue;
      const value = data.get(question.key);
      const empty =
        question.kind === 'photo'
          ? !(value instanceof File && value.size > 0)
          : typeof value !== 'string' || value.trim() === '';
      if (empty) return question;
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (waitingForCaptcha) return;
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    if (turnstileToken) fd.append('turnstileToken', turnstileToken);

    const missing = firstMissing(fd);
    if (missing) {
      setErrorMsg(`Merci de renseigner « ${missing.label} ».`);
      setStatus('error');
      const field = formEl.querySelector<HTMLElement>(`[name="${missing.key}"]`);
      field?.focus();
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/musician-submissions', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Erreur lors de l’envoi.');
      }

      setStatus('success');
      formEl.reset();
      setSection('');
      setPhotoName('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setStatus('error');
      renewCaptcha();
      setTimeout(() => setStatus('idle'), 6000);
    }
  };

  if (status === 'success') {
    return (
      <div className="contribute-success">
        <p className="eyebrow eyebrow--gold">{form.success.eyebrow}</p>
        <h2 className="contribute-success__title">
          <em>{form.success.titleItalic}</em>
          {form.success.title ? ` ${form.success.title}` : ''}
        </h2>
        <hr className="velvet-rule long" />
        <p className="contribute-success__body">{form.success.body}</p>
      </div>
    );
  }

  const renderQuestion = (question: ResolvedQuestion) => {
    const label = (
      <>
        {question.label}
        {question.required && (
          <>
            {' '}
            <span aria-hidden>·</span> <em>requis</em>
          </>
        )}
      </>
    );

    if (question.kind === 'section') {
      const choices = question.choices ?? [];
      return (
        <div className="form-group" key={question.key}>
          <label>{label}</label>
          <div className="contribute-pills" role="radiogroup" aria-label={question.label}>
            {choices.map((choice) => {
              const active = section === choice.value;
              return (
                <label
                  key={choice.value}
                  className={`contribute-pill${active ? ' is-active' : ''}`}
                >
                  <input
                    type="radio"
                    name={question.key}
                    value={choice.value}
                    id={`section-${choice.value}`}
                    checked={active}
                    onChange={() => setSection(choice.value)}
                  />
                  <span>{choice.label}</span>
                </label>
              );
            })}
            {question.undecidedLabel && (
              <label className={`contribute-pill${section === '' ? ' is-active' : ''}`}>
                <input
                  type="radio"
                  name={question.key}
                  value=""
                  id="section-tbd"
                  checked={section === ''}
                  onChange={() => setSection('')}
                />
                <span>{question.undecidedLabel}</span>
              </label>
            )}
          </div>
          {question.hint && <p className="form-hint">{question.hint}</p>}
        </div>
      );
    }

    if (question.kind === 'photo') {
      return (
        <div className="form-group" key={question.key}>
          <label htmlFor={question.key}>{label}</label>
          <div
            className={`contribute-dropzone${photoName ? ' has-file' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={question.label}
          >
            <input
              ref={fileInputRef}
              type="file"
              id={question.key}
              name={question.key}
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="contribute-dropzone__input"
            />
            <span className="contribute-dropzone__icon" aria-hidden>
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="1.5" />
                <circle cx="8.5" cy="10" r="1.6" />
                <path d="M21 16l-5.5-5.5L7 19" />
              </svg>
            </span>
            <span className="contribute-dropzone__copy">
              {photoName ? (
                <>
                  <em>{photoName}</em>
                  <span className="contribute-dropzone__hint">Cliquez pour changer.</span>
                </>
              ) : (
                <>
                  <em>{question.placeholder || 'Déposez votre portrait'}</em>
                  {question.hint && (
                    <span className="contribute-dropzone__hint">{question.hint}</span>
                  )}
                </>
              )}
            </span>
          </div>
        </div>
      );
    }

    if (question.kind === 'textarea') {
      return (
        <div className="form-group" key={question.key}>
          <label htmlFor={question.key}>{label}</label>
          <textarea
            id={question.key}
            name={question.key}
            rows={question.rows ?? 4}
            placeholder={question.placeholder || undefined}
          />
          {question.hint && <p className="form-hint">{question.hint}</p>}
        </div>
      );
    }

    return (
      <div className="form-group" key={question.key}>
        <label htmlFor={question.key}>{label}</label>
        <input
          type={INPUT_TYPES[question.kind] || 'text'}
          id={question.key}
          name={question.key}
          autoComplete={question.autoComplete || 'off'}
          placeholder={question.placeholder || undefined}
        />
        {question.hint && <p className="form-hint">{question.hint}</p>}
      </div>
    );
  };

  return (
    <form className="contribute-form" onSubmit={handleSubmit} noValidate>
      {/* Anti-robots : jeton signé (vérifié par l'API) et pot de miel. */}
      <input type="hidden" name="formToken" value={formToken} />
      <div style={HONEYPOT_STYLE} aria-hidden="true">
        <label htmlFor="website">Site web</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {form.parts.map((part, index) => (
        <fieldset className="contribute-act" key={`${part.title}-${index}`} data-live-field="parts">
          <legend className="contribute-act__legend">
            <span className="contribute-act__index">{ROMAN[index] ?? index + 1}.</span>
            <span className="eyebrow eyebrow--gold">{part.title}</span>
          </legend>
          <hr className="velvet-rule" />
          {part.lede && <p className="contribute-act__lede">{part.lede}</p>}

          {layoutQuestions(part.questions).map((row, rowIndex) =>
            row.length > 1 ? (
              <div className="contribute-row" key={`row-${rowIndex}`}>
                {row.map(renderQuestion)}
              </div>
            ) : (
              renderQuestion(row[0])
            ),
          )}
        </fieldset>
      ))}

      <div className="contribute-outro" data-live-field="outro">
        <p className="contribute-outro__line">
          <em>Merci d’avance.</em> {form.outro.line}
        </p>
        <hr className="velvet-rule long" />

        {status === 'error' && (
          <p className="contribute-outro__error" role="alert">
            <em>{errorMsg || 'Une erreur est survenue.'}</em> Merci de réessayer ou de nous écrire
            directement.
          </p>
        )}

        {turnstileSiteKey && (
          <div className="form-group contribute-captcha">
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
          <p className="contribute-outro__error" role="alert">
            <em>La vérification anti-robot n&apos;a pas pu se charger.</em> Rechargez la page
            ou réessayez plus tard.
          </p>
        )}

        <button
          type="submit"
          className="btn-filled"
          disabled={status === 'sending' || waitingForCaptcha}
        >
          {status === 'sending' ? 'Envoi…' : form.outro.submitLabel}
          <span aria-hidden>→</span>
        </button>

        <p className="contribute-outro__fallback">
          {form.outro.fallback}{' '}
          <a href="mailto:contact@lachambresymphonique.fr?subject=Ma%20fiche%20musicien">
            {form.outro.fallbackLinkLabel}
          </a>{' '}
          et nous reprenons à la main.
        </p>
      </div>
    </form>
  );
}
