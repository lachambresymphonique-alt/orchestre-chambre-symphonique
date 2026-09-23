'use client';

import './admin-theme-settings.css';
import { useEffect, useState } from 'react';
import { useField } from '@payloadcms/ui';
import type { TextFieldClientProps } from 'payload';
import {
  COLOR_BY_FIELD,
  colorModeOf,
  contrastRatio,
  effectiveColor,
  normalizeHex,
  pageBackground,
  type ColorField,
} from '@/lib/theme';
import { useThemeForm } from './themeAdmin';

/** Couleurs posées en texte : exigences de lecture (WCAG). Les autres : repérage visuel. */
const TEXT_COLORS: ColorField[] = ['colorHeadings', 'colorText', 'colorMuted', 'colorLink', 'buttonText'];

function verdict(field: ColorField, ratio: number): { label: string; tone: 'good' | 'ok' | 'weak' } {
  if (TEXT_COLORS.includes(field)) {
    if (ratio >= 7) return { label: 'Excellent', tone: 'good' };
    if (ratio >= 4.5) return { label: 'Bien lisible', tone: 'good' };
    if (ratio >= 3) return { label: 'Grands textes seulement', tone: 'ok' };
    return { label: 'Trop peu lisible', tone: 'weak' };
  }
  if (ratio >= 3) return { label: 'Bien visible', tone: 'good' };
  if (ratio >= 2) return { label: 'Discret', tone: 'ok' };
  return { label: 'Peu visible', tone: 'weak' };
}

/**
 * Une couleur du thème : pastille (ouvre le sélecteur du navigateur), code
 * hexadécimal modifiable, contraste mesuré contre le fond sur lequel elle se
 * pose, et retour à la couleur d'origine.
 */
export function ThemeColorField(props: TextFieldClientProps) {
  const { path } = props;
  const { value, setValue, showError, errorMessage } = useField<string>({ path });
  const doc = useThemeForm();

  const info = COLOR_BY_FIELD[path as ColorField];
  const field = info?.field ?? (path as ColorField);
  const chosen = normalizeHex(value);
  const fallback = info?.fallback[colorModeOf(doc)] ?? '#000000';
  const shown = chosen ?? fallback;

  // Saisie libre : on garde ce qui est tapé, le formulaire ne reçoit qu'une couleur valide ou rien.
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => setDraft(value ?? ''), [value]);

  const against =
    info?.contrastWith && info.contrastWith !== 'page'
      ? effectiveColor(doc, info.contrastWith)
      : pageBackground(doc);
  const ratio = contrastRatio(shown, against);
  const v = verdict(field, ratio);

  return (
    <div className="lcs-color" id={`field-${path}`}>
      <div className="lcs-color__top">
        <label className="lcs-color__swatch" style={{ background: shown }} title="Choisir une couleur">
          <input
            type="color"
            value={shown}
            onChange={(e) => setValue(e.target.value)}
            aria-label={`${info?.label ?? path} — choisir une couleur`}
          />
          {!chosen && <span className="lcs-color__origin">origine</span>}
        </label>
        <div className="lcs-color__meta">
          <div className="lcs-color__label">{info?.label ?? path}</div>
          <input
            className="lcs-color__hex"
            value={draft}
            placeholder={fallback}
            spellCheck={false}
            onChange={(e) => {
              setDraft(e.target.value);
              const hex = normalizeHex(e.target.value);
              if (hex) setValue(hex);
              else if (e.target.value.trim() === '') setValue(null);
            }}
            onBlur={() => setDraft(value ?? '')}
            aria-label={`${info?.label ?? path} — code hexadécimal`}
          />
        </div>
      </div>

      <div className="lcs-color__foot">
        <span className={`lcs-contrast lcs-contrast--${v.tone}`} title="Contraste avec le fond sur lequel la couleur se pose">
          <span className="lcs-contrast__chip" style={{ background: against, color: shown }}>
            Aa
          </span>
          {ratio.toFixed(1)}:1 · {v.label}
        </span>
        {chosen && (
          <button type="button" className="lcs-link-btn" onClick={() => setValue(null)}>
            Rétablir
          </button>
        )}
      </div>
      {info?.where && <p className="lcs-color__where">{info.where}</p>}
      {showError && errorMessage && <p className="lcs-color__error">{errorMessage}</p>}
    </div>
  );
}

export default ThemeColorField;
