'use client';

import './admin-display-font.css';
import { useEffect } from 'react';
import { useField } from '@payloadcms/ui';
import type { RadioFieldClientProps } from 'payload';

type Option = { label: string | Record<string, string>; value: string };

/** Feuille Google Fonts chargée dans l'admin pour que les aperçus soient réels. */
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..500,0..100,0..1;1,9..144,300..500,0..100,0..1&family=Ibarra+Real+Nova:ital,wght@0,400..600;1,400..600&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..500;1,6..96,400..500&display=swap';

const SAMPLES: Record<
  string,
  { roman: string; italic: string; hint: string }
> = {
  ibarra: {
    roman: "'Ibarra Real Nova', Georgia, serif",
    italic: "'Ibarra Real Nova', Georgia, serif",
    hint: 'Chaleureuse et littéraire, inspirée des livres du XVIIIe siècle. Son italique porte bien le romantisme, et elle reste lisible dans les petits titres.',
  },
  bodoni: {
    roman: "'Bodoni Moda', Georgia, serif",
    italic: "'Bodoni Moda', Georgia, serif",
    hint: 'Contrastée, comme les pages de titre des partitions anciennes. Ses traits fins captent la lumière dorée. La plus spectaculaire en haut de page.',
  },
  'fraunces-sharp': {
    roman: 'Fraunces, Georgia, serif',
    italic: 'Fraunces, Georgia, serif',
    hint: 'La police actuelle, arrondi supprimé : le dessin devient fin et net, sans changer le reste du site.',
  },
  'fraunces-soft': {
    roman: 'Fraunces, Georgia, serif',
    italic: 'Fraunces, Georgia, serif',
    hint: 'Le dessin d’origine du site, aux empattements arrondis.',
  },
};

/** Réglages de variations propres à Fraunces, pour distinguer les deux versions. */
const VARIATIONS: Record<string, string> = {
  'fraunces-sharp': '"opsz" 144, "SOFT" 0, "WONK" 0',
  'fraunces-soft': '"opsz" 144, "SOFT" 100',
};

/**
 * Choix de la typographie des titres du site : une vignette par police, écrite
 * dans la police elle-même. Le choix s'applique à tous les titres après
 * enregistrement (voir le bloc « TYPOGRAPHIE DES TITRES » de globals.css).
 */
export function DisplayFontField(props: RadioFieldClientProps) {
  const { path, field } = props;
  const { value, setValue } = useField<string>({ path });

  // Les polices ne font pas partie de l'admin : on les charge le temps de la page.
  useEffect(() => {
    if (document.querySelector('link[data-lcs-fonts]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONTS_HREF;
    link.setAttribute('data-lcs-fonts', '');
    document.head.appendChild(link);
  }, []);

  const options = (field.options as Option[]) ?? [];
  const current = value || options[0]?.value;
  const label = typeof field.label === 'string' ? field.label : 'Typographie des titres';
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : null;

  return (
    <div className="field-type radio lcs-layout" id={`field-${path.replace(/\./g, '__')}`}>
      <div className="field-label">{label}</div>
      {description && <div className="field-description">{description}</div>}
      <div role="radiogroup" aria-label={label} className="lcs-layout__grid lcs-layout__grid--fonts">
        {options.map((opt) => {
          const name = typeof opt.label === 'string' ? opt.label : opt.value;
          const sample = SAMPLES[opt.value];
          const active = current === opt.value;
          const variation = VARIATIONS[opt.value];
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={`lcs-layout__tile${active ? ' is-active' : ''}`}
              onClick={() => setValue(opt.value)}
            >
              <span className="lcs-layout__art lcs-layout__art--type" aria-hidden="true">
                <span
                  className="lcs-fontsample"
                  style={{
                    fontFamily: sample?.roman,
                    fontVariationSettings: variation,
                  }}
                >
                  La Chambre
                  <em
                    style={{
                      fontFamily: sample?.italic,
                      fontVariationSettings: variation,
                    }}
                  >
                    Symphonique
                  </em>
                </span>
              </span>
              <span className="lcs-layout__name">
                <span className="lcs-layout__dot" aria-hidden="true" />
                {name}
              </span>
              {sample?.hint && <span className="lcs-layout__hint">{sample.hint}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DisplayFontField;
