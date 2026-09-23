'use client';

import { useEffect, useRef } from 'react';
import { useLiveGlobal } from '@/hooks/useLiveDocument';
import { resolveTheme, type ThemeDoc } from '@/lib/theme';

/**
 * Aperçu en direct de « Réglages → Apparence du site ».
 *
 * Le layout pose le thème enregistré sur <html> au rendu serveur. Dans
 * l'aperçu de l'admin, chaque frappe envoie le formulaire : on recalcule les
 * mêmes variables (src/lib/theme.ts) et on les applique aussitôt, en retirant
 * celles qui ne sont plus choisies. Hors de l'aperçu, ce composant ne fait rien.
 */
export function ThemeLive() {
  const live = useLiveGlobal<ThemeDoc | null>('theme-settings', null, 0);
  const applied = useRef<string[]>([]);

  useEffect(() => {
    if (!live) return;
    const root = document.documentElement;
    const { vars, attrs } = resolveTheme(live);

    for (const name of applied.current) if (!(name in vars)) root.style.removeProperty(name);
    // Variables posées par le serveur et désormais retirées du formulaire.
    for (let i = root.style.length - 1; i >= 0; i--) {
      const name = root.style[i];
      if (name.startsWith('--') && !(name in vars)) root.style.removeProperty(name);
    }
    for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
    for (const [name, value] of Object.entries(attrs)) root.setAttribute(name, value);
    applied.current = Object.keys(vars);
  }, [live]);

  return null;
}

export default ThemeLive;
