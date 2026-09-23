'use client';

import './admin-theme-settings.css';
import { useField, useForm } from '@payloadcms/ui';
import type { TextFieldClientProps } from 'payload';
import {
  BAND_BACKGROUND,
  COLOR_MODES,
  PAGE_BACKGROUNDS,
  colorModeOf,
  matchingPreset,
  type ColorField,
  type ColorMode,
} from '@/lib/theme';
import { useThemeForm } from './themeAdmin';

/** Encres du texte : propres à chaque ambiance, remises à l'origine au changement. */
const INKS: ColorField[] = ['colorHeadings', 'colorText', 'colorMuted'];

/** Mini-page de chaque ambiance : bandeau, titre, lignes de texte, bouton. */
function Thumb({ mode }: { mode: ColorMode }) {
  const light = mode === 'light';
  const ink = light ? '#1f1712' : '#f9edddd9';
  const line = light ? '#3b302855' : '#e9dccd44';
  return (
    <svg viewBox="0 0 160 96" className="lcs-mode__svg" aria-hidden="true">
      <rect width="160" height="96" fill={PAGE_BACKGROUNDS[mode]} />
      <rect width="160" height="34" fill={light ? BAND_BACKGROUND : '#0f0b09'} />
      <rect x="12" y="10" width="54" height="5" rx="1" fill="#f9eddd" opacity="0.9" />
      <rect x="12" y="19" width="36" height="5" rx="1" fill="#f2b772" opacity="0.9" />
      <rect x="12" y="44" width="46" height="4" rx="1" fill={ink} />
      <rect x="12" y="54" width="120" height="2.5" rx="1" fill={line} />
      <rect x="12" y="60" width="104" height="2.5" rx="1" fill={line} />
      <rect x="12" y="66" width="112" height="2.5" rx="1" fill={line} />
      <rect x="12" y="76" width="34" height="9" fill={light ? '#c2410c' : '#e34d00'} />
    </svg>
  );
}

/**
 * Ambiance sombre ou claire. Au changement, les couleurs suivent : une palette
 * reconnue passe à sa déclinaison pour la nouvelle ambiance, et les encres du
 * texte (pensées pour un fond précis) reviennent à l'origine.
 */
export function ThemeModeField(props: TextFieldClientProps) {
  const { path } = props;
  const { setValue } = useField<string>({ path });
  const { dispatchFields, setModified } = useForm();
  const doc = useThemeForm();
  const current = colorModeOf(doc);

  const choose = (next: ColorMode) => {
    if (next === current) return;
    const preset = matchingPreset(doc, current);
    if (preset) {
      for (const [field, value] of Object.entries(preset.values[next])) {
        dispatchFields({ type: 'UPDATE', path: field, value: value ?? null });
      }
    } else {
      for (const field of INKS) dispatchFields({ type: 'UPDATE', path: field, value: null });
    }
    setValue(next === 'dark' ? null : next);
    setModified(true);
  };

  return (
    <div className="lcs-mode" id={`field-${path}`}>
      <div className="lcs-tsection lcs-tsection--first">
        <h3 className="lcs-tsection__title">Ambiance</h3>
        <p className="lcs-tsection__desc">
          Le fond du site. Les palettes et les couleurs d’origine s’adaptent à l’ambiance choisie.
        </p>
      </div>
      <div role="radiogroup" aria-label="Ambiance" className="lcs-mode__grid">
        {COLOR_MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={current === m.value}
            className={`lcs-choice__tile lcs-mode__tile${current === m.value ? ' is-active' : ''}`}
            onClick={() => choose(m.value)}
          >
            <Thumb mode={m.value} />
            <span className="lcs-choice__name">{m.label}</span>
            <span className="lcs-choice__hint">{m.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ThemeModeField;
