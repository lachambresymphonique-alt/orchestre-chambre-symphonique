'use client';

import './admin-theme-settings.css';
import { useField } from '@payloadcms/ui';
import type { TextFieldClientProps } from 'payload';
import {
  BAND_BACKGROUND,
  FONT_ROLES,
  colorModeOf,
  effectiveColor,
  effectiveFont,
  fontsForRole,
  pageBackground,
  type FontRole,
} from '@/lib/theme';
import { useThemeFonts, useThemeForm } from './themeAdmin';
import { BAND_TEXT, fontStyle } from './ThemeSpecimen';

/** Ce qu'écrit l'aperçu de chaque niveau, à sa taille réelle ou presque. */
const SAMPLE: Record<FontRole, { text: React.ReactNode; className: string; opsz?: number }> = {
  h1: {
    text: (
      <>
        La Chambre <em>Symphonique</em>
      </>
    ),
    className: 'lcs-font__sample--h1',
  },
  h2: {
    text: (
      <>
        Prochains <em>concerts</em>
      </>
    ),
    className: 'lcs-font__sample--h2',
    opsz: 60,
  },
  h3: {
    text: <>Concerto pour violon — Beethoven</>,
    className: 'lcs-font__sample--h3',
    opsz: 36,
  },
  body: {
    text: (
      <>
        Fondée en 2017, La Chambre Symphonique rassemble de jeunes musiciens autour du grand répertoire.{' '}
        <em>Chaque concert est une rencontre.</em>
      </>
    ),
    className: 'lcs-font__sample--body',
    opsz: 18,
  },
  ui: {
    text: <>Prochain concert · Samedi 31 octobre · Réserver →</>,
    className: 'lcs-font__sample--ui',
  },
};

/**
 * Choix de la police d'un niveau de texte : l'aperçu écrit dans la police
 * retenue, puis une vignette par police proposée, chacune écrite dans sa police.
 * Le rôle vient du nom du champ (fontH1, fontBody…).
 */
export function ThemeFontField(props: TextFieldClientProps) {
  const { path } = props;
  useThemeFonts();
  const { value, setValue } = useField<string>({ path });
  const doc = useThemeForm();

  const info = FONT_ROLES.find((r) => r.field === path) ?? FONT_ROLES[0];
  const current = effectiveFont(doc, info.role);
  const inherited = effectiveFont({ ...doc, [info.field]: null }, info.role);
  const options = fontsForRole(info.role);
  const sample = SAMPLE[info.role];
  // En ambiance claire, le titre 1 vit surtout dans les bandeaux sombres (bannière, en-têtes).
  const onBand = info.role === 'h1' && colorModeOf(doc) === 'light';
  const ink = onBand
    ? BAND_TEXT.headings
    : effectiveColor(doc, info.role === 'body' ? 'colorText' : info.role === 'ui' ? 'colorMuted' : 'colorHeadings');

  return (
    <div className="lcs-font" id={`field-${path}`}>
      <div className="lcs-font__head">
        <div>
          <div className="lcs-font__label">{info.label}</div>
          <div className="lcs-font__where">{info.where}</div>
        </div>
        <div className="lcs-font__state">
          <span className="lcs-font__current">{current.label}</span>
          {value ? (
            <button type="button" className="lcs-link-btn" onClick={() => setValue(null)}>
              Revenir à {inherited.label}
            </button>
          ) : (
            <span className="lcs-font__origin">par défaut</span>
          )}
        </div>
      </div>

      <div className="lcs-font__stage" style={{ background: onBand ? BAND_BACKGROUND : pageBackground(doc) }}>
        <p
          className={`lcs-font__sample ${sample.className}`}
          style={{
            ...fontStyle(current, sample.opsz),
            color: ink,
            ['--lcs-em' as string]: onBand ? BAND_TEXT.glow : effectiveColor(doc, 'colorLink'),
          }}
        >
          {sample.text}
        </p>
      </div>

      {[
        { title: 'Avec empattements', list: options.filter((f) => !f.sans) },
        { title: 'Sans empattements', list: options.filter((f) => f.sans) },
      ]
        .filter((g) => g.list.length > 0)
        .map((group) => (
          <div key={group.title} className="lcs-font__group">
            <div className="lcs-font__group-title">{group.title}</div>
            <div
              role="radiogroup"
              aria-label={`${info.label} — ${group.title.toLowerCase()}`}
              className="lcs-font__options"
            >
              {group.list.map((font) => {
                const active = font.key === current.key;
                return (
                  <button
                    key={font.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`lcs-font__option${active ? ' is-active' : ''}`}
                    onClick={() => setValue(font.key === inherited.key ? null : font.key)}
                    title={font.hint}
                  >
                    <span className="lcs-font__option-aa" style={fontStyle(font, 60)} aria-hidden="true">
                      Aa
                    </span>
                    <span className="lcs-font__option-name">{font.label}</span>
                    {font.key === inherited.key && <span className="lcs-font__option-tag">par défaut</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      <p className="lcs-font__hint">{current.hint}</p>
    </div>
  );
}

export default ThemeFontField;
