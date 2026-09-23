'use client';

import './admin-article.css';
import { useEffect, useRef } from 'react';
import { useFormFields } from '@payloadcms/ui';
import { postCategory } from '@/lib/postCategories';

/**
 * Feuille Google Fonts : les polices du site, absentes de l’admin, pour que
 * l’article s’écrive dans la typographie où il sera lu.
 */
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..600,0..100,0..1;1,9..144,300..600,0..100,0..1&family=Ibarra+Real+Nova:ital,wght@0,400..600;1,400..600&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..500;1,6..96,400..500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..600;1,8..60,400..600&family=Inter:wght@300..700&display=swap';

type Props = { displayFont: string };

export function ArticleCanvasClient({ displayFont }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const category = useFormFields(([fields]) => fields?.category?.value as string | undefined);

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
    return () => root.removeAttribute('data-display');
  }, [displayFont]);

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
