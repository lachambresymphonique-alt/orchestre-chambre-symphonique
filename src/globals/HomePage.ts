import type { GlobalConfig } from 'payload'

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Page d\'accueil',
  admin: {
    group: 'Pages',
    description: 'Contenu de la page d\'accueil : bannière, présentation et newsletter.',
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      label: 'Bannière principale',
      admin: { description: 'Grande section en haut de la page d\'accueil.' },
      fields: [
        { name: 'subtitle', type: 'text', label: 'Sur-titre', admin: { description: 'Petit texte au-dessus du titre principal.' } },
        { name: 'titleLine1', type: 'text', label: 'Titre — ligne 1' },
        { name: 'titleLine2Italic', type: 'text', label: 'Titre — ligne 2 (italique)' },
        { name: 'description', type: 'textarea', label: 'Description', admin: { description: 'Texte d\'accroche sous le titre.' } },
        { name: 'ctaPrimaryText', type: 'text', label: 'Bouton principal — texte', admin: { description: 'Ex : « Découvrir nos concerts »' } },
        { name: 'ctaPrimaryLink', type: 'text', label: 'Bouton principal — lien', admin: { description: 'Page vers laquelle le bouton redirige (ex : /nous-soutenir).' } },
        { name: 'ctaSecondaryText', type: 'text', label: 'Bouton secondaire — texte' },
        { name: 'ctaSecondaryLink', type: 'text', label: 'Bouton secondaire — lien' },
      ],
    },
    {
      name: 'presentation',
      type: 'group',
      label: 'Section Présentation',
      admin: { description: 'Bloc de texte avec photo, affiché sous les concerts.' },
      fields: [
        { name: 'subtitle', type: 'text', label: 'Sur-titre' },
        { name: 'title', type: 'text', label: 'Titre' },
        { name: 'paragraphs', type: 'textarea', label: 'Texte de présentation', admin: { description: 'Plusieurs paragraphes séparés par des sauts de ligne.' } },
        { name: 'ctaText', type: 'text', label: 'Bouton — texte', admin: { description: 'Ex : « En savoir plus »' } },
        { name: 'ctaLink', type: 'text', label: 'Bouton — lien' },
        { name: 'signature', type: 'text', label: 'Signature', admin: { description: 'Nom affiché sous le texte (ex : le directeur artistique).' } },
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Photo d\'illustration' },
      ],
    },
    {
      name: 'newsletter',
      type: 'group',
      label: 'Section Newsletter',
      admin: { description: 'Bloc d\'inscription à la newsletter, en bas de page.' },
      fields: [
        { name: 'subtitle', type: 'text', label: 'Sur-titre' },
        { name: 'title', type: 'text', label: 'Titre' },
        { name: 'description', type: 'textarea', label: 'Description', admin: { description: 'Texte d\'accroche pour inciter à s\'inscrire.' } },
      ],
    },
  ],
}
