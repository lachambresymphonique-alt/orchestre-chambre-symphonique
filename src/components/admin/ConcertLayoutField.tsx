'use client';

import type { ReactNode } from 'react';
import { useField } from '@payloadcms/ui';
import type { RadioFieldClientProps } from 'payload';

type Option = { label: string | Record<string, string>; value: string };

const GOLD = '#C9A84C';

/**
 * Schémas des trois mises en page (fond sombre comme le site).
 * Tout est dessiné en `currentColor` : la vignette reste lisible en mode sombre.
 */
const PREVIEWS: Record<string, { hint: string; art: ReactNode }> = {
  posters: {
    hint: 'Une affiche par date, en grille. Le visuel du concert donne envie de cliquer.',
    art: (
      <svg viewBox="0 0 160 90" aria-hidden="true">
        {[14, 60, 106].map((x) => (
          <g key={x}>
            <rect x={x} y={8} width={40} height={52} rx={1} fill="currentColor" opacity={0.16} />
            <rect x={x} y={48} width={11} height={12} fill={GOLD} opacity={0.95} />
            <rect x={x} y={67} width={30} height={3} rx={1.5} fill="currentColor" opacity={0.75} />
            <rect x={x} y={74} width={20} height={3} rx={1.5} fill={GOLD} opacity={0.7} />
          </g>
        ))}
      </svg>
    ),
  },
  strip: {
    hint: 'Les affiches défilent horizontalement, une à la fois. Idéal avec beaucoup de dates.',
    art: (
      <svg viewBox="0 0 160 90" aria-hidden="true">
        <circle cx={134} cy={11} r={4.5} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.5} />
        <circle cx={148} cy={11} r={4.5} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.5} />
        {[14, 60, 106, 152].map((x) => (
          <g key={x}>
            <rect x={x} y={22} width={40} height={46} rx={1} fill="currentColor" opacity={0.16} />
            <rect x={x} y={57} width={11} height={11} fill={GOLD} opacity={0.95} />
            <rect x={x} y={74} width={30} height={3} rx={1.5} fill="currentColor" opacity={0.75} />
            <rect x={x} y={81} width={20} height={3} rx={1.5} fill={GOLD} opacity={0.7} />
          </g>
        ))}
      </svg>
    ),
  },
  list: {
    hint: 'Rangées datées, sobres. Le prochain concert ouvre avec sa photo.',
    art: (
      <svg viewBox="0 0 160 90" aria-hidden="true">
        <rect x={14} y={8} width={50} height={34} rx={1} fill="currentColor" opacity={0.16} />
        <rect x={72} y={10} width={12} height={12} fill={GOLD} opacity={0.95} />
        <rect x={72} y={27} width={70} height={3} rx={1.5} fill="currentColor" opacity={0.75} />
        <rect x={72} y={34} width={44} height={3} rx={1.5} fill={GOLD} opacity={0.7} />
        <rect x={14} y={50} width={132} height={1} fill="currentColor" opacity={0.25} />
        <rect x={14} y={56} width={10} height={10} fill={GOLD} opacity={0.95} />
        <rect x={34} y={57} width={70} height={3} rx={1.5} fill="currentColor" opacity={0.75} />
        <rect x={34} y={64} width={40} height={3} rx={1.5} fill={GOLD} opacity={0.7} />
        <rect x={14} y={73} width={132} height={1} fill="currentColor" opacity={0.25} />
        <rect x={14} y={79} width={10} height={10} fill={GOLD} opacity={0.95} />
        <rect x={34} y={80} width={60} height={3} rx={1.5} fill="currentColor" opacity={0.75} />
      </svg>
    ),
  },
};

/**
 * Champ « Affichage des concerts » de la page d'accueil : trois vignettes-radio
 * qui montrent chaque mise en page. Le clic met à jour l'aperçu en direct.
 */
export function ConcertLayoutField(props: RadioFieldClientProps) {
  const { path, field } = props;
  const { value, setValue } = useField<string>({ path });

  const options = (field.options as Option[]) ?? [];
  // Le formulaire reçoit déjà la valeur par défaut du champ ; à défaut, la première option.
  const current = value || options[0]?.value;
  const label = typeof field.label === 'string' ? field.label : 'Affichage';
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : null;

  return (
    <div className="field-type radio lcs-layout" id={`field-${path.replace(/\./g, '__')}`}>
      <div className="field-label">{label}</div>
      {description && <div className="field-description">{description}</div>}
      <div role="radiogroup" aria-label={label} className="lcs-layout__grid">
        {options.map((opt) => {
          const name = typeof opt.label === 'string' ? opt.label : opt.value;
          const preview = PREVIEWS[opt.value];
          const active = current === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={`lcs-layout__tile${active ? ' is-active' : ''}`}
              onClick={() => setValue(opt.value)}
            >
              <span className="lcs-layout__art">{preview?.art}</span>
              <span className="lcs-layout__name">
                <span className="lcs-layout__dot" aria-hidden="true" />
                {name}
              </span>
              {preview?.hint && <span className="lcs-layout__hint">{preview.hint}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
