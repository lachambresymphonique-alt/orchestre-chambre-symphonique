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
      name: 'featured',
      type: 'group',
      label: 'À la une',
      admin: {
        description:
          "Tout ce qui est mis en avant sur la page d'accueil : le chef et ses solistes invités.",
      },
      fields: [
        {
          name: 'directorLabel',
          type: 'text',
          label: 'Label du chef',
          defaultValue: 'Le chef',
          admin: {
            description:
              "Petit sur-titre affiché au-dessus du nom dans la grande carte (ex : « Le chef », « Direction artistique », « Le maestro »).",
          },
        },
        {
          name: 'directorLinkLabel',
          type: 'text',
          label: 'Texte du lien « Sa vision »',
          defaultValue: 'Sa vision',
          admin: {
            description:
              "Texte du lien sous la phrase de présentation. Ex : « Sa vision », « Le rencontrer », « En savoir plus ».",
          },
        },
        {
          name: 'director',
          type: 'relationship',
          relationTo: 'musicians' as any,
          label: 'Musicien à la une (le chef)',
          admin: {
            description:
              "Apparaît dans la grande carte et alimente la photo de la bannière par défaut. Le musicien doit d'abord exister dans la collection Musiciens.",
          },
        },
        {
          name: 'soloistsTitle',
          type: 'text',
          label: 'Titre de la section Solistes',
          defaultValue: 'Solistes invités',
          admin: {
            description:
              "Titre affiché au-dessus de la liste des solistes mis en avant.",
          },
        },
        {
          name: 'soloistsIntro',
          type: 'textarea',
          label: 'Introduction Solistes',
          admin: {
            description:
              "Une phrase ou deux pour présenter les solistes invités (optionnel).",
          },
        },
        {
          name: 'soloists',
          type: 'array',
          label: 'Solistes mis en avant',
          labels: { singular: 'Soliste', plural: 'Solistes' },
          admin: {
            description:
              "Sélectionnez les solistes à afficher sur la page d'accueil. Ils doivent d'abord exister dans la collection Solistes. L'ordre suit celui de la liste ci-dessous.",
          },
          fields: [
            {
              name: 'soloist',
              type: 'relationship',
              relationTo: 'soloists' as any,
              required: true,
              label: 'Soliste',
            },
            {
              name: 'contextOverride',
              type: 'text',
              label: 'Contexte (à afficher)',
              admin: {
                description:
                  "Optionnel. Si rempli, écrase le « Contexte d'apparition » de la fiche soliste pour cette mise en avant.",
              },
            },
          ],
        },
      ],
    },
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
        {
          name: 'portraitImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Photo de la bannière',
          admin: {
            description: 'Image principale (portrait) à droite du titre. Si laissée vide, la photo du directeur artistique est utilisée à défaut.',
          },
        },
        {
          name: 'portraitCaption',
          type: 'text',
          label: 'Légende de la photo',
          admin: {
            description: 'Petit texte affiché en bas de la photo. Ex : « Loïc Emmelin, direction ».',
          },
        },
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
