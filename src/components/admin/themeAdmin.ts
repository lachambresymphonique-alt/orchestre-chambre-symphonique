'use client';

import { useEffect } from 'react';
import { useFormFields } from '@payloadcms/ui';
import { ADMIN_FONTS_HREF, THEME_FIELDS, type ThemeDoc } from '@/lib/theme';

/**
 * Outils partagés par les champs de « Réglages → Apparence du site ».
 */

/** Les polices du catalogue ne font pas partie de l'admin : on les charge le temps de la page. */
export function useThemeFonts() {
  useEffect(() => {
    if (document.querySelector('link[data-lcs-theme-fonts]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = ADMIN_FONTS_HREF;
    link.setAttribute('data-lcs-theme-fonts', '');
    document.head.appendChild(link);
  }, []);
}

/** Les réglages du thème tels qu'ils sont dans le formulaire (non enregistrés compris). */
export function useThemeForm(): ThemeDoc {
  return useFormFields(([fields]) => {
    const doc: Record<string, unknown> = { displayFont: fields.displayFont?.value ?? null };
    for (const name of THEME_FIELDS) doc[name] = fields[name]?.value ?? null;
    return doc as ThemeDoc;
  });
}

