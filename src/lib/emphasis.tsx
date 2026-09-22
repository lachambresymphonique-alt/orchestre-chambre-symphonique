import type { ReactNode } from 'react';

/**
 * Renders « un titre avec un mot *en italique* » : every segment wrapped in
 * asterisks becomes an <em>. Lets editors control the coloured italic word of
 * a heading from a plain text field in the admin.
 */
export function renderEmphasis(text: string): ReactNode[] {
  const parts = text.split(/\*([^*]+)\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <em key={i}>{part}</em> : <span key={i}>{part}</span>,
  );
}
