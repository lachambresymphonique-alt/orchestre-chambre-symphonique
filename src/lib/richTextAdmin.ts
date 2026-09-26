/**
 * Variantes de l'éditeur de texte mis en forme de l'admin
 * (components/admin/RichTextField) :
 * - `prose`  : paragraphes, titre, sous-titre, liste, gras, italique ;
 * - `inline` : un paragraphe, gras, italique, Entrée = retour à la ligne ;
 * - `lines`  : une ligne par retour (manifeste de l'accueil), italique ;
 * - `title`  : une seule ligne, italique (le mot en italique coloré).
 */
export type RichTextVariant = 'prose' | 'inline' | 'lines' | 'title';

/**
 * `admin.components` d'un champ `textarea` (ou `text` pour `title`) saisi
 * avec mise en forme. La valeur reste une chaîne, lue par lib/richText :
 *
 *   admin: { ...richTextAdmin('prose'), description: '…' }
 */
export function richTextAdmin(variant: RichTextVariant) {
  return {
    components: {
      Field: {
        path: '@/components/admin/RichTextField#RichTextField',
        clientProps: { variant },
      },
      Cell: '@/components/admin/RichTextCell#RichTextCell',
    },
  };
}
