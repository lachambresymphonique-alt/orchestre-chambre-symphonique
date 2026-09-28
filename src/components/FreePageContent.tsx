import Link from 'next/link';
import { Sections } from '@/components/sections/Sections';
import { InsertPoint, PreviewDropZone, PreviewSelection } from '@/components/sections/PreviewEditing';
import { PreviewInlineEditing } from '@/components/sections/InlineEditing';
import type { ConcertCard } from '@/lib/concerts';
import { resolveSections } from '@/lib/sections';

/**
 * Rendu d'une page libre (collection « Pages »), partagé par la page publique
 * (/[slug]) et son aperçu en direct dans l'admin (/apercu/pages) : l'aperçu
 * montre exactement ce que verront les visiteurs.
 *
 * Le titre, puis les sections de la page (src/components/sections). Une page
 * d'avant les sections (champ « Contenu » seul) s'affiche par une section
 * « Texte » équivalente : voir resolveSections.
 *
 * Les attributs data-live-field relient chaque bloc au champ de l'admin
 * (voir useLivePreviewSync) ; ils n'ont aucun effet hors de l'aperçu.
 */

type Props = {
  title?: string | null;
  layout?: unknown;
  content?: unknown;
  /** Prochains concerts, pour une section « Concerts » (chargés par la route). */
  upcomingConcerts?: ConcertCard[];
  /** Aperçu : montre où apparaîtront le titre et les sections tant qu'ils sont vides. */
  placeholders?: boolean;
};

const placeholderStyle = { opacity: 0.35 } as const;

export function FreePageContent({ title, layout, content, upcomingConcerts, placeholders = false }: Props) {
  const heading = (title ?? '').trim();
  const sections = resolveSections({ layout, content });

  return (
    <main className="free-page">
      {placeholders && <PreviewDropZone />}
      {placeholders && <PreviewSelection />}
      {placeholders && <PreviewInlineEditing />}
      <div className="page-header">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> / {heading || 'Page'}
          </p>
          <h1
            data-live-field="title"
            {...(placeholders ? { 'data-lcs-edit': 'title', 'data-lcs-kind': 'plain', 'data-lcs-empty': heading ? undefined : 'true' } : {})}
          >
            {heading || (placeholders ? <span style={placeholderStyle}>Titre de la page</span> : null)}
          </h1>
        </div>
      </div>
      {sections.length > 0 ? (
        <Sections sections={sections} upcomingConcerts={upcomingConcerts} preview={placeholders} />
      ) : placeholders ? (
        <section className="section lcs-empty-page" data-live-field="layout">
          <div className="container">
            <p style={placeholderStyle}>Votre page est vide. Ajoutez une première section : un texte, une photo, une citation…</p>
            <InsertPoint index={0} big />
          </div>
        </section>
      ) : null}
    </main>
  );
}
