'use client';

import './admin-theme-settings.css';
import { useForm } from '@payloadcms/ui';
import {
  COLOR_PRESETS,
  COLORS,
  colorModeOf,
  effectiveColor,
  matchingPreset,
  pageBackground,
  type ThemeDoc,
} from '@/lib/theme';
import { useThemeForm } from './themeAdmin';

/**
 * Palettes prêtes à l'emploi, dans la déclinaison de l'ambiance choisie : un
 * clic remplace les couleurs d'accent et de bouton du formulaire (rien n'est
 * publié avant « Enregistrer »), qu'on peut ensuite ajuster. Chaque vignette
 * montre la palette en situation : un titre en italique, un filet, un bouton.
 */
export function ThemePresets() {
  const { dispatchFields, setModified } = useForm();
  const doc = useThemeForm();
  const mode = colorModeOf(doc);
  const active = matchingPreset(doc, mode);

  const apply = (key: string) => {
    const preset = COLOR_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    for (const c of COLORS) {
      dispatchFields({ type: 'UPDATE', path: c.field, value: preset.values[mode][c.field] ?? null });
    }
    setModified(true);
  };

  return (
    <div className="lcs-presets">
      <div className="lcs-tsection">
        <h3 className="lcs-tsection__title">Palettes</h3>
        <p className="lcs-tsection__desc">
          Un point de départ, décliné pour l’ambiance {mode === 'light' ? 'claire' : 'sombre'} : la palette
          remplace les couleurs d’accent et de bouton, vous pouvez ensuite ajuster chaque couleur.
        </p>
      </div>
      <div className="lcs-presets__grid">
        {COLOR_PRESETS.map((preset) => {
          const look: ThemeDoc = { ...doc, ...preset.values[mode] };
          const isActive = active?.key === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              className={`lcs-presets__tile${isActive ? ' is-active' : ''}`}
              aria-pressed={isActive}
              onClick={() => apply(preset.key)}
            >
              <span className="lcs-presets__scene" style={{ background: pageBackground(doc) }} aria-hidden="true">
                <span className="lcs-presets__title" style={{ color: effectiveColor(look, 'colorHeadings') }}>
                  Prochains <em style={{ color: effectiveColor(look, 'colorLink') }}>concerts</em>
                </span>
                <span className="lcs-presets__rule" style={{ background: effectiveColor(look, 'colorAccent') }} />
                <span
                  className="lcs-presets__btn"
                  style={{
                    background: effectiveColor(look, 'buttonBg'),
                    color: effectiveColor(look, 'buttonText'),
                  }}
                >
                  Réserver →
                </span>
              </span>
              <span className="lcs-presets__name">{preset.label}</span>
              <span className="lcs-presets__hint">{preset.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ThemePresets;
