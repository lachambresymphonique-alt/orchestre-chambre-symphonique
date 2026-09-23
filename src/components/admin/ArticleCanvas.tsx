import type { Payload } from 'payload';
import { getPayloadClient } from '@/lib/payload';
import { adminFontStack, effectiveFont, normalizeHex, type ThemeDoc } from '@/lib/theme';
import { ArticleCanvasClient } from './ArticleCanvasClient';

/** Couleurs d'« Apparence du site » → variables de l'écran d'article (admin-article.css). */
const ARTICLE_COLORS: Array<[keyof ThemeDoc, string]> = [
  ['colorHeadings', '--lcs-a-cream'],
  ['colorText', '--lcs-a-cream-soft'],
  ['colorMuted', '--lcs-a-mute'],
  ['colorLink', '--lcs-a-amber'],
  ['colorAccent', '--lcs-a-velvet'],
];

/**
 * En tête du formulaire d’article (champ « ui » de la collection Posts).
 *
 * Côté serveur, lit la typographie des titres choisie dans « Réglages →
 * Apparence du site » ; le composant client charge les polices, applique ce
 * choix à l’écran d’édition et affiche le fil d’Ariane comme sur la page
 * publique. Le reste de la mise en page « façon article » est en CSS
 * (admin-article.css), rattaché à `.collection-edit--posts`.
 */
export async function ArticleCanvas(props: { payload?: Payload }) {
  let theme: ThemeDoc | null = null;
  try {
    const payload = props.payload ?? (await getPayloadClient());
    theme = (await payload.findGlobal({ slug: 'theme-settings' as any })) as ThemeDoc;
  } catch {
    // Réglage absent : dessin d’origine.
  }
  // L'article s'écrit dans les polices où il sera lu : titre (H1), texte, interface.
  const title = effectiveFont(theme, 'h1');
  const vars: Record<string, string> = {
    '--lcs-a-display': adminFontStack(title),
    '--lcs-a-serif': adminFontStack(effectiveFont(theme, 'body')),
    '--lcs-a-sans': adminFontStack(effectiveFont(theme, 'ui')),
  };
  if (title.sharp) vars['--lcs-a-soft'] = '0';
  for (const [field, name] of ARTICLE_COLORS) {
    const hex = normalizeHex(theme?.[field]);
    if (hex) vars[name] = hex;
  }
  return <ArticleCanvasClient displayFont={title.key} vars={vars} />;
}

export default ArticleCanvas;
