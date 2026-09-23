'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Noms des boutons de la barre d’outils du texte, en français.
 *
 * Payload dessine ces boutons avec une icône seule, sans infobulle ni nom
 * lisible par un lecteur d’écran. Chaque bouton porte la classe
 * `toolbar-popup__button-<clé>` : on lui ajoute `title` et `aria-label`.
 */
const LABELS: Record<string, string> = {
  paragraph: 'Paragraphe',
  h2: 'Titre 2',
  h3: 'Titre 3',
  h4: 'Titre 4',
  'heading-2': 'Titre 2',
  'heading-3': 'Titre 3',
  'heading-4': 'Titre 4',
  unorderedList: 'Liste à puces',
  orderedList: 'Liste numérotée',
  blockquote: 'Citation',
  bold: 'Gras',
  italic: 'Italique',
  underline: 'Souligné',
  link: 'Lien',
  indentIncrease: 'Augmenter le retrait',
  indentDecrease: 'Diminuer le retrait',
  upload: 'Insérer une image',
  horizontalRule: 'Filet de séparation',
};

const PREFIX = 'toolbar-popup__button-';

function label(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(`[class*="${PREFIX}"]`).forEach((button) => {
    if (button.getAttribute('aria-label')) return;
    const key = Array.from(button.classList)
      .find((c) => c.startsWith(PREFIX))
      ?.slice(PREFIX.length);
    const text = key ? LABELS[key] : undefined;
    if (!text) return;
    button.setAttribute('title', text);
    button.setAttribute('aria-label', text);
  });
}

/** Nomme les boutons de toutes les barres d’outils sous l’écran contenant `ref`. */
export function useToolbarLabels(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>('.collection-edit');
    if (!root) return;
    label(root);
    // La barre d’outils se monte après le reste du formulaire, et la barre
    // flottante apparaît à chaque sélection : on suit les ajouts.
    const observer = new MutationObserver(() => label(root));
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [ref]);
}
