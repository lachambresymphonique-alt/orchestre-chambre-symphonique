'use client';

import './admin-theme-settings.css';
import { useForm } from '@payloadcms/ui';
import {
  BUTTON_SHAPES,
  BUTTON_STYLES,
  COLORS,
  COLOR_MODES,
  colorModeOf,
  matchingPreset,
  FONT_ROLES,
  THEME_FIELDS,
  effectiveColor,
  effectiveFont,
  normalizeHex,
} from '@/lib/theme';
import { useThemeForm } from './themeAdmin';

const SHORT: Record<string, string> = { h1: 'H1', h2: 'H2', h3: 'H3', body: 'Texte', ui: 'Interface' };

/**
 * Barre latérale d'« Apparence du site » : le thème en un coup d'œil, combien
 * de réglages s'écartent de l'origine, et le retour au dessin d'origine.
 */
export function ThemeSummary() {
  const { dispatchFields, setModified } = useForm();
  const doc = useThemeForm();

  const changed = THEME_FIELDS.filter((f) => {
    const v = (doc as Record<string, unknown>)[f];
    return v !== null && v !== undefined && v !== '';
  }).length;

  const reset = () => {
    for (const f of THEME_FIELDS) dispatchFields({ type: 'UPDATE', path: f, value: null });
    setModified(true);
  };

  const style = BUTTON_STYLES.find((s) => s.value === doc.buttonStyle) ?? BUTTON_STYLES[0];
  const shape = BUTTON_SHAPES.find((s) => s.value === doc.buttonShape) ?? BUTTON_SHAPES[0];

  return (
    <aside className="lcs-tsummary" aria-label="Résumé du thème">
      <h4 className="lcs-tsummary__title">Votre thème</h4>

      <dl className="lcs-tsummary__fonts">
        {FONT_ROLES.map((r) => (
          <div key={r.role}>
            <dt>{SHORT[r.role]}</dt>
            <dd>{effectiveFont(doc, r.role).label}</dd>
          </div>
        ))}
      </dl>

      <div className="lcs-tsummary__colors" aria-label="Couleurs">
        {COLORS.map((c) => (
          <span
            key={c.field}
            title={`${c.label} — ${effectiveColor(doc, c.field)}${normalizeHex(doc[c.field]) ? '' : ' (origine)'}`}
            style={{ background: effectiveColor(doc, c.field) }}
          />
        ))}
      </div>
      <p className="lcs-tsummary__buttons">
        Ambiance {COLOR_MODES.find((m) => m.value === colorModeOf(doc))?.label.toLowerCase()}
        {matchingPreset(doc) ? ` · palette ${matchingPreset(doc)!.label}` : ' · couleurs personnalisées'}
      </p>
      <p className="lcs-tsummary__buttons">
        Boutons : {style.label.toLowerCase()}, angles {shape.label.toLowerCase()}
      </p>

      <p className="lcs-tsummary__count">
        {changed === 0
          ? 'Dessin d’origine : aucun réglage modifié.'
          : `${changed} réglage${changed > 1 ? 's' : ''} modifié${changed > 1 ? 's' : ''}.`}
      </p>
      {changed > 0 && (
        <>
          <button type="button" className="lcs-tsummary__reset" onClick={reset}>
            Revenir au dessin d’origine
          </button>
          <p className="lcs-tsummary__note">Remet le formulaire à l’origine ; rien n’est publié avant « Enregistrer ».</p>
        </>
      )}
    </aside>
  );
}

export default ThemeSummary;
