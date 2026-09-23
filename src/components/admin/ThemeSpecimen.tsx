'use client';

import './admin-theme-settings.css';
import type { CSSProperties } from 'react';
import {
  BAND_BACKGROUND,
  BUTTON_SHAPES,
  COLOR_BY_FIELD,
  adminFontStack,
  colorModeOf,
  effectiveColor,
  effectiveFont,
  pageBackground,
  type FontOption,
  type ThemeDoc,
} from '@/lib/theme';
import { useThemeFonts, useThemeForm } from './themeAdmin';

/** Réglages de variations : Fraunces affûté ou arrondi, taille optique des grands titres. */
export const variationFor = (font: FontOption, opsz = 144): string | undefined =>
  font.family === 'Fraunces' ? `"opsz" ${opsz}, "SOFT" ${font.sharp ? 0 : 100}, "WONK" 0` : undefined;

export const fontStyle = (font: FontOption, opsz?: number): CSSProperties => ({
  fontFamily: adminFontStack(font),
  fontVariationSettings: variationFor(font, opsz),
});

/** Styles du bouton plein (ou en contour) d'après le formulaire. */
export function buttonStyle(doc: ThemeDoc, hover = false): CSSProperties {
  const bg = effectiveColor(doc, hover ? 'buttonHover' : 'buttonBg');
  const ink = effectiveColor(doc, 'buttonText');
  const radius = BUTTON_SHAPES.find((s) => s.value === doc.buttonShape)?.radius ?? '0px';
  const outline = doc.buttonStyle === 'outline' && !hover;
  return {
    fontFamily: adminFontStack(effectiveFont(doc, 'ui')),
    borderRadius: radius,
    background: outline ? 'transparent' : bg,
    color: outline ? effectiveColor(doc, 'buttonBg') : ink,
    boxShadow: outline ? `inset 0 0 0 1px ${effectiveColor(doc, 'buttonBg')}` : undefined,
  };
}

/** Texte des bandeaux encrés en ambiance claire : ils gardent leurs couleurs d'origine. */
export const BAND_TEXT = {
  headings: COLOR_BY_FIELD.colorHeadings.fallback.dark,
  muted: COLOR_BY_FIELD.colorMuted.fallback.dark,
  glow: '#f2b772',
};

/**
 * Aperçu du thème en tête de chaque onglet : un extrait de page du site avec
 * les polices et les couleurs du formulaire. En ambiance claire, le grand
 * titre est posé sur un bandeau sombre, comme la bannière du site. Il suit
 * chaque réglage avant même l'enregistrement, aperçu en direct ouvert ou non.
 */
export function ThemeSpecimen() {
  useThemeFonts();
  const doc = useThemeForm();

  const h1 = effectiveFont(doc, 'h1');
  const h2 = effectiveFont(doc, 'h2');
  const h3 = effectiveFont(doc, 'h3');
  const body = effectiveFont(doc, 'body');
  const ui = effectiveFont(doc, 'ui');

  const c = {
    headings: effectiveColor(doc, 'colorHeadings'),
    text: effectiveColor(doc, 'colorText'),
    muted: effectiveColor(doc, 'colorMuted'),
    accent: effectiveColor(doc, 'colorAccent'),
    link: effectiveColor(doc, 'colorLink'),
  };

  const light = colorModeOf(doc) === 'light';

  const tag = (level: string, font: FontOption) => (
    <span className="lcs-spec__tag">
      <b>{level}</b> {font.label}
    </span>
  );

  return (
    <figure className="lcs-spec" aria-label="Aperçu du thème">
      <div className={`lcs-spec__page${light ? ' is-light' : ''}`} style={{ background: pageBackground(doc) }}>
        <div className={light ? 'lcs-spec__band' : 'lcs-spec__group'} style={light ? { background: BAND_BACKGROUND } : undefined}>
          <div className="lcs-spec__line">
            {tag('Interface', ui)}
            <p
              className="lcs-spec__eyebrow"
              style={{ ...fontStyle(ui), color: light ? BAND_TEXT.muted : c.muted }}
            >
              La saison 2026
              <span className="lcs-spec__rule" style={{ background: c.accent }} />
            </p>
          </div>
          <div className="lcs-spec__line">
            {tag('H1', h1)}
            <p
              className="lcs-spec__h1"
              style={{ ...fontStyle(h1), color: light ? BAND_TEXT.headings : c.headings }}
            >
              La Chambre <em style={{ color: light ? BAND_TEXT.glow : c.link }}>Symphonique</em>
            </p>
          </div>
          {light && <p className="lcs-spec__band-note">Bandeau sur photo : reste sombre en ambiance claire.</p>}
        </div>
        <div className="lcs-spec__line">
          {tag('H2', h2)}
          <p className="lcs-spec__h2" style={{ ...fontStyle(h2, 60), color: c.headings }}>
            Prochains <em style={{ color: c.link }}>concerts</em>
          </p>
        </div>
        <div className="lcs-spec__line">
          {tag('H3', h3)}
          <p className="lcs-spec__h3" style={{ ...fontStyle(h3, 36), color: c.headings }}>
            Concerto pour violon — Beethoven
          </p>
        </div>
        <div className="lcs-spec__line">
          {tag('Texte', body)}
          <p className="lcs-spec__body" style={{ ...fontStyle(body, 18), color: c.text }}>
            Fondée en 2017, La Chambre Symphonique rassemble de jeunes musiciens, étudiants et
            amateurs éclairés autour du grand répertoire, pour que chaque concert soit une rencontre.
          </p>
        </div>
        <div className="lcs-spec__line lcs-spec__line--actions">
          {tag('Boutons', ui)}
          <div className="lcs-spec__actions">
            <span className="lcs-spec__btn" style={buttonStyle(doc)}>
              Réserver une place →
            </span>
            <span className="lcs-spec__btn" style={buttonStyle(doc, true)} title="Le même bouton au survol">
              Au survol →
            </span>
            <span className="lcs-spec__link" style={{ ...fontStyle(ui), color: c.link }}>
              Notre histoire →
            </span>
          </div>
        </div>
      </div>
      <figcaption className="lcs-spec__caption">
        Aperçu — suit chaque réglage avant l’enregistrement. Le site entier se voit dans l’aperçu en direct.
      </figcaption>
    </figure>
  );
}

export default ThemeSpecimen;
