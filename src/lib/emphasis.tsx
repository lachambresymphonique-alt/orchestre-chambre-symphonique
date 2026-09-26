import type { ReactNode } from 'react';
import { renderInline } from '@/lib/richText';

/**
 * Renders « un titre avec un mot *en italique* » : every segment wrapped in
 * asterisks becomes an <em>. Lets editors control the coloured italic word of
 * a heading from a plain text field in the admin (italic button of the
 * `title` editor, see lib/richTextAdmin). Same reader as the rich texts, so
 * `**gras**` and an escaped `\*` work here too.
 */
export function renderEmphasis(text: string): ReactNode[] {
  return renderInline(text);
}
