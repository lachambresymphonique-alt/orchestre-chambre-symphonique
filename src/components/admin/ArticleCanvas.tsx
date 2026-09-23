import type { Payload } from 'payload';
import { getPayloadClient } from '@/lib/payload';
import { ArticleCanvasClient } from './ArticleCanvasClient';

const DISPLAY_FONTS = ['fraunces-soft', 'fraunces-sharp', 'ibarra', 'bodoni'];

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
  let displayFont = 'fraunces-soft';
  try {
    const payload = props.payload ?? (await getPayloadClient());
    const theme = await payload.findGlobal({ slug: 'theme-settings' as any });
    const chosen = (theme as any)?.displayFont;
    if (typeof chosen === 'string' && DISPLAY_FONTS.includes(chosen)) displayFont = chosen;
  } catch {
    // Réglage absent : dessin d’origine.
  }
  return <ArticleCanvasClient displayFont={displayFont} />;
}

export default ArticleCanvas;
