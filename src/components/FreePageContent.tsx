import { RichText } from '@payloadcms/richtext-lexical/react';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

/**
 * Rendu d'une page libre (collection « Pages »), partagé par la page publique
 * (/[slug]) et son aperçu en direct dans l'admin (/apercu/pages) : l'aperçu
 * montre exactement ce que verront les visiteurs.
 *
 * Les attributs data-live-field relient chaque bloc au champ de l'admin
 * (voir useLivePreviewSync) ; ils n'ont aucun effet hors de l'aperçu.
 */

type Props = {
  title?: string | null;
  content?: unknown;
  /** Aperçu : montre où apparaîtront le titre et le texte tant qu'ils sont vides. */
  placeholders?: boolean;
};

type LexicalNode = { type?: string; text?: string; children?: LexicalNode[] };

function isEditorState(value: unknown): value is SerializedEditorState {
  return Boolean(value && typeof value === 'object' && (value as { root?: unknown }).root);
}

/** Vrai si le texte riche contient autre chose qu'un paragraphe vide. */
function hasContent(value: unknown): boolean {
  if (!isEditorState(value)) return false;
  const walk = (node: LexicalNode): boolean => {
    if (typeof node.text === 'string' && node.text.trim().length > 0) return true;
    if (node.type && !['root', 'paragraph', 'text', 'linebreak'].includes(node.type)) return true;
    return Array.isArray(node.children) && node.children.some(walk);
  };
  return walk(value.root as unknown as LexicalNode);
}

const placeholderStyle = { opacity: 0.35 } as const;

export function FreePageContent({ title, content, placeholders = false }: Props) {
  const heading = (title ?? '').trim();
  const filled = hasContent(content);

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="section-label">Page</div>
          <h1 className="section-title" data-live-field="title">
            {heading || (placeholders ? <span style={placeholderStyle}>Titre de la page</span> : null)}
          </h1>
          <div className="rich-text-content" data-live-field="content">
            {/* Page publique : rendu inchangé ; aperçu : repère tant que le texte est vide. */}
            {isEditorState(content) && (filled || !placeholders) ? (
              <RichText data={content} />
            ) : placeholders ? (
              <p style={placeholderStyle}>Le contenu de la page s’affichera ici au fil de la saisie.</p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
