/** Pictogrammes des gestes sur une section (barre de l'aperçu, panneau de l'admin). */
export const SECTION_ICONS = {
  up: 'M12 19V5M5 12l7-7 7 7',
  down: 'M12 5v14M5 12l7 7 7-7',
  duplicate: 'M9 9h10v10H9zM5 15V5h10',
  show: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  hide: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.9 8.3 2 12 2 12s4 7 10 7a9.7 9.7 0 0 0 5.4-1.6',
  delete: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  back: 'M19 12H5M11 5l-7 7 7 7',
} as const;

export function SectionIcon({ name, size = 15 }: { name: keyof typeof SECTION_ICONS; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={SECTION_ICONS[name]} />
    </svg>
  );
}
