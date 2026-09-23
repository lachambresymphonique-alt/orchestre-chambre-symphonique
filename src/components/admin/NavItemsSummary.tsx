'use client';

import './admin-navigation.css';
import { useFormFields } from '@payloadcms/ui';

/** Au-delà, le menu déborde sur tablette (constaté avec 8 à 9 entrées). */
const OVERFLOW_AT = 7;

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/**
 * Compteur affiché sous « Entrées du menu » : entrées affichées et masquées,
 * mis à jour en direct pendant l'édition, avec une alerte si le menu risque
 * de déborder ou s'il est vide.
 */
export function NavItemsSummary() {
  // Chaîne plutôt qu'objet : le composant ne se réaffiche que si les comptes changent.
  const counts = useFormFields(([fields]) => {
    const items = fields?.items as { rows?: unknown[]; value?: unknown } | undefined;
    const total = Array.isArray(items?.rows) ? items.rows.length : Number(items?.value) || 0;
    let hidden = 0;
    for (let i = 0; i < total; i++) {
      if (fields?.[`items.${i}.hidden`]?.value === true) hidden++;
    }
    return `${total}|${hidden}`;
  });
  const [total, hidden] = counts.split('|').map(Number);
  const shown = total - hidden;

  if (total === 0) {
    return (
      <p className="lcs-navsum">
        Aucune entrée : le site affiche le menu par défaut, avec toutes les pages.
      </p>
    );
  }

  return (
    <p className="lcs-navsum">
      <strong>{plural(shown, 'entrée affichée', 'entrées affichées')}</strong>
      {hidden > 0 && <> · {plural(hidden, 'masquée', 'masquées')}</>}
      {shown === 0 && <span className="lcs-navsum__warn"> · le menu du site est vide</span>}
      {shown > OVERFLOW_AT && (
        <span className="lcs-navsum__warn">
          {' '}
          · au-delà de {OVERFLOW_AT}, le menu déborde sur tablette : masquez-en quelques-unes
        </span>
      )}
    </p>
  );
}

export default NavItemsSummary;
