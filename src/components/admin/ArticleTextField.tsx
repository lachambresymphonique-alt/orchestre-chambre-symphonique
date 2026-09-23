'use client';

import './admin-article.css';
import { useCallback, useEffect, useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { useField } from '@payloadcms/ui';
import type { TextFieldClientProps, TextareaFieldClientProps } from 'payload';

type Variant = 'title' | 'lede';

type Props = (TextFieldClientProps | TextareaFieldClientProps) & {
  /** `title` : le grand titre italique ; `lede` : le chapeau en serif. */
  variant?: Variant;
};

const PLACEHOLDERS: Record<Variant, string> = {
  title: 'Titre de l’article',
  lede: 'Chapeau : deux ou trois phrases qui donnent envie de lire.',
};

/**
 * Titre et chapeau de l’article, saisis directement dans la typographie de
 * la page publique (bandeau sombre du formulaire). Une zone de texte qui
 * grandit avec son contenu, sans cadre : on écrit « sur » l’article.
 */
export function ArticleTextField(props: Props) {
  const { path, field, variant = 'title' } = props;
  const { value, setValue, showError, errorMessage, disabled } = useField<string>({ path });
  const ref = useRef<HTMLTextAreaElement>(null);

  const text = typeof value === 'string' ? value : '';
  const maxLength = (field as { maxLength?: number }).maxLength;
  const placeholder =
    typeof field.admin?.placeholder === 'string' ? field.admin.placeholder : PLACEHOLDERS[variant];
  const label = typeof field.label === 'string' ? field.label : path;
  const id = `field-${path.replace(/\./g, '__')}`;

  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useLayoutEffect(fit, [fit, text, variant]);

  useEffect(() => {
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [fit]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Un titre tient sur une ligne logique : Entrée n’insère pas de saut.
      if (variant === 'title' && e.key === 'Enter') e.preventDefault();
    },
    [variant],
  );

  return (
    <div
      className={`field-type lcs-text lcs-text--${variant}${showError ? ' error' : ''}`}
      id={id}
    >
      <label className="lcs-visually-hidden" htmlFor={`${id}-input`}>
        {label}
      </label>
      <textarea
        id={`${id}-input`}
        ref={ref}
        className="lcs-text__input"
        value={text}
        rows={1}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={typeof maxLength === 'number' ? maxLength : undefined}
        aria-invalid={showError || undefined}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          const next = e.target.value;
          setValue(variant === 'title' ? next.replace(/[\r\n]+/g, ' ') : next);
        }}
      />
      {variant === 'lede' && typeof maxLength === 'number' && (
        <span className="lcs-text__count" aria-live="polite">
          {text.length} / {maxLength}
        </span>
      )}
      {showError && errorMessage && (
        <p className="lcs-article__error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export default ArticleTextField;
