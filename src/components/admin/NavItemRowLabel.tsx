'use client';

import { useRowLabel } from '@payloadcms/ui';
import { BUILTIN_PAGES } from '@/lib/navigation';

type Row = {
  label?: string;
  type?: string;
  builtin?: string;
  url?: string;
};

/**
 * Titre d'une ligne repliée dans « Menu du site » : le texte affiché, sinon
 * le nom de la page fixe ou l'adresse, sinon « Entrée 01 ».
 */
export function NavItemRowLabel() {
  const { data, rowNumber } = useRowLabel<Row>();

  const fallback =
    data?.type === 'builtin'
      ? BUILTIN_PAGES.find((p) => p.value === data.builtin)?.label
      : data?.type === 'custom'
        ? data.url
        : data?.type === 'page'
          ? 'Page de l\'admin'
          : undefined;

  const text =
    data?.label?.trim() || fallback || `Entrée ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`;

  return <span>{text}</span>;
}
