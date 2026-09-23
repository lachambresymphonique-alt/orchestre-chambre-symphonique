'use client';

import './admin-theme-settings.css';
import { useField } from '@payloadcms/ui';
import type { TextFieldClientProps } from 'payload';
import { BUTTON_SHAPES, BUTTON_STYLES, pageBackground } from '@/lib/theme';
import { useThemeForm } from './themeAdmin';
import { buttonStyle } from './ThemeSpecimen';

/**
 * Style et forme des boutons : une vignette par choix, chacune dessinant le
 * bouton tel qu'il sera, avec les couleurs du formulaire.
 */
export function ThemeChoiceField(props: TextFieldClientProps) {
  const { path, field } = props;
  const { value, setValue } = useField<string>({ path });
  const doc = useThemeForm();

  const isShape = path === 'buttonShape';
  const options = isShape ? BUTTON_SHAPES : BUTTON_STYLES;
  const current = value || options[0].value;
  const label = typeof field?.label === 'string' ? field.label : isShape ? 'Forme' : 'Style';

  return (
    <div className="lcs-choice" id={`field-${path}`}>
      <div className="lcs-choice__label">{label}</div>
      <div role="radiogroup" aria-label={label} className="lcs-choice__grid">
        {options.map((opt) => {
          const active = current === opt.value;
          const preview = isShape
            ? buttonStyle({ ...doc, buttonShape: opt.value })
            : buttonStyle({ ...doc, buttonStyle: opt.value });
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={`lcs-choice__tile${active ? ' is-active' : ''}`}
              // Le premier choix est l'origine : on l'enregistre comme « vide ».
              onClick={() => setValue(opt.value === options[0].value ? null : opt.value)}
            >
              <span className="lcs-choice__stage" style={{ background: pageBackground(doc) }}>
                <span className="lcs-spec__btn lcs-spec__btn--small" style={preview}>
                  Réserver →
                </span>
              </span>
              <span className="lcs-choice__name">{opt.label}</span>
              <span className="lcs-choice__hint">{opt.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ThemeChoiceField;
