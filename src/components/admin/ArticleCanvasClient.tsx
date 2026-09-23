'use client';

import './admin-article.css';
import { useEffect, useRef } from 'react';
import { useFormFields } from '@payloadcms/ui';
import { postCategory } from '@/lib/postCategories';
import { ADMIN_FONTS_HREF } from '@/lib/theme';
import { useToolbarLabels } from './useToolbarLabels';

/**
 * Feuille Google Fonts : les polices du site (tout le catalogue d'« Apparence
 * du site »), absentes de l’admin, pour que l’article s’écrive dans la
 * typographie où il sera lu.
 */
const FONTS_HREF = ADMIN_FONTS_HREF;

type Props = {
  displayFont: string;
  /** Polices et couleurs d'« Apparence du site », en variables de admin-article.css. */
  vars?: Record<string, string>;
};

export function ArticleCanvasClient({ displayFont, vars }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const category = useFormFields(([fields]) => fields?.category?.value as string | undefined);
  useToolbarLabels(ref);

  useEffect(() => {
    if (document.querySelector('link[data-lcs-article-fonts]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONTS_HREF;
    link.setAttribute('data-lcs-article-fonts', '');
    document.head.appendChild(link);
  }, []);

  // La typographie des titres se lit sur la racine de l’écran d’édition
  // (voir `[data-display]` dans admin-article.css).
  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>('.collection-edit');
    if (!root) return;
    root.setAttribute('data-display', displayFont);
    const entries = Object.entries(vars ?? {});
    for (const [name, value] of entries) root.style.setProperty(name, value);
    return () => {
      root.removeAttribute('data-display');
      for (const [name] of entries) root.style.removeProperty(name);
    };
  }, [displayFont, vars]);

  const rubric = postCategory(category);

  return (
    <div ref={ref} className="field-type lcs-article__crumb" aria-hidden="true">
      <span>Accueil</span>
      <span className="lcs-article__crumb-sep">/</span>
      <span>Blog</span>
      <span className="lcs-article__crumb-sep">/</span>
      <span>{rubric.plural}</span>
    </div>
  );
}

export default ArticleCanvasClient;
