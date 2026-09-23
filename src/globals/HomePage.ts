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
          name: 'directorTaglineFallback',
          type: 'text',
          label: 'Phrase sous le nom du chef (par défaut)',
          defaultValue: 'Violoniste de formation, directeur artistique de l\'orchestre depuis sa fondation en 2017.',
          admin: {
            description:
              'Affichée dans la grande carte si la fiche du musicien n\'a pas de « Phrase signature ».',
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
          name: 'soloistsEyebrow',
          type: 'text',
          label: 'Sur-titre de la section Solistes',
          defaultValue: 'Avec nous',
        },
        {
          name: 'soloistLinkLabel',
          type: 'text',
          label: 'Texte du lien vers le site du soliste',
          defaultValue: 'Son univers',
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
        {
          name: 'credits',
          type: 'array',
          label: 'Ligne de repères (bas de bannière)',
          labels: { singular: 'Repère', plural: 'Repères' },
          maxRows: 4,
          defaultValue: [
            { text: 'Fondé en 2017' },
            { text: '40 à 80 musiciens' },
            { text: 'Direction Loïc Emmelin' },
          ],
          admin: { description: 'Petits mots séparés par des points, en bas à gauche de la bannière.' },
          fields: [{ name: 'text', type: 'text', required: true, label: 'Texte' }],
        },
      ],
    },
    {
      name: 'statement',
      type: 'group',
      label: 'Section Conviction',
      admin: { description: 'Le manifeste en grandes lettres sous la bannière, avec une photo d\'ambiance.' },
      fields: [
        { name: 'eyebrow', type: 'text', label: 'Sur-titre', defaultValue: 'Notre conviction' },
        {
          name: 'lines',
          type: 'textarea',
          label: 'Texte du manifeste',
          defaultValue:
            'Une *chambre* de musiciens\nqui jouent le répertoire *symphonique*\nsans rien perdre : ni la précision,\nni la chaleur, ni l\'*émotion*\ndu premier accord.',
          admin: {
            description:
              'Un retour à la ligne = une ligne à l\'écran. Un mot entre astérisques est mis en italique coloré : *chambre*.',
          },
        },
        { name: 'ctaText', type: 'text', label: 'Lien — texte', defaultValue: 'Notre histoire' },
        { name: 'ctaLink', type: 'text', label: 'Lien — page', defaultValue: '/a-propos' },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Photo d\'ambiance',
          admin: { description: 'Si vide, une photo d\'illustration par défaut est utilisée.' },
        },
      ],
    },
    {
      name: 'concerts',
      type: 'group',
      label: 'Section Concerts',
      admin: {
        description:
          'Affichage, titres et libellés des prochains concerts. Les concerts eux-mêmes se gèrent dans Contenu → Concerts.',
      },
      fields: [
        {
          name: 'layout',
          type: 'radio',
          label: 'Affichage des concerts',
          defaultValue: 'posters',
          options: [
            { label: 'Affiches', value: 'posters' },
            { label: 'Bande', value: 'strip' },
            { label: 'Liste', value: 'list' },
          ],
          admin: {
            description:
              "Comment les prochains concerts apparaissent sur la page d'accueil. L'aperçu à droite se met à jour aussitôt ; enregistrez pour publier.",
            components: {
              Field: '@/components/admin/ConcertLayoutField#ConcertLayoutField',
            },
          },
        },
        { name: 'eyebrow', type: 'text', label: 'Sur-titre', defaultValue: 'La saison' },
        {
          name: 'title',
          type: 'text',
          label: 'Titre',
          defaultValue: '*Prochains* concerts',
          admin: { description: 'Un mot entre astérisques est mis en italique coloré.' },
        },
        { name: 'nextLabel', type: 'text', label: 'Étiquette « Prochain concert »', defaultValue: 'Prochain concert' },
        { name: 'todayLabel', type: 'text', label: 'Étiquette le jour même', defaultValue: 'Aujourd\'hui' },
        { name: 'cancelledLabel', type: 'text', label: 'Étiquette concert annulé', defaultValue: 'Annulé' },
        { name: 'bookingLabel', type: 'text', label: 'Bouton de réservation (prochain concert)', defaultValue: 'Réserver une place' },
        { name: 'bookingLabelShort', type: 'text', label: 'Lien de réservation (autres dates)', defaultValue: 'Réserver' },
        {
          name: 'emptyTitle',
          type: 'text',
          label: 'Aucune date — titre',
          defaultValue: 'La prochaine saison se prépare.',
          admin: { description: 'Affiché quand aucun concert à venir n\'est publié.' },
        },
        {
          name: 'emptyText',
          type: 'textarea',
          label: 'Aucune date — texte',
          defaultValue:
            'Les dates seront annoncées ici dès qu\'elles seront fixées. Inscrivez-vous à la lettre d\'information pour être prévenu·e en avant-première.',
        },
        { name: 'emptyCtaText', type: 'text', label: 'Aucune date — lien', defaultValue: 'Recevoir les prochaines dates' },
      ],
    },
    {
      name: 'bento',
      type: 'group',
      label: 'Section Rencontre',
      admin: { description: 'Les trois cartes : le chef, les musiciens, l\'histoire.' },
      fields: [
        { name: 'eyebrow', type: 'text', label: 'Sur-titre', defaultValue: 'Rencontre' },
        {
          name: 'title',
          type: 'text',
          label: 'Titre',
          defaultValue: '*Les visages* de l\'orchestre',
          admin: { description: 'Un mot entre astérisques est mis en italique coloré.' },
        },
        { name: 'musiciansEyebrow', type: 'text', label: 'Carte musiciens — sur-titre', defaultValue: 'L\'ensemble' },
        { name: 'musiciansTitle', type: 'text', label: 'Carte musiciens — titre', defaultValue: '*Les musiciens*' },
        {
          name: 'musiciansText',
          type: 'textarea',
          label: 'Carte musiciens — texte',
          defaultValue:
            'Issus de conservatoires français, suisses et belges. Étudiants, amateurs éclairés, jeunes professionnels.',
        },
        { name: 'musiciansLinkLabel', type: 'text', label: 'Carte musiciens — lien', defaultValue: 'Découvrir' },
        { name: 'historyEyebrow', type: 'text', label: 'Carte histoire — sur-titre', defaultValue: 'Depuis' },
        { name: 'historyYear', type: 'text', label: 'Carte histoire — année', defaultValue: '2017' },
        {
          name: 'historyText',
          type: 'textarea',
          label: 'Carte histoire — texte',
          defaultValue:
            'Fondé à Mâcon, l\'orchestre rassemble plus de 80 musiciens autour de la passion du répertoire symphonique.',
        },
        { name: 'historyLinkLabel', type: 'text', label: 'Carte histoire — lien', defaultValue: 'L\'histoire' },
        { name: 'historyLink', type: 'text', label: 'Carte histoire — page', defaultValue: '/a-propos' },
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
        { name: 'placeholder', type: 'text', label: 'Texte du champ e-mail', defaultValue: 'Votre adresse e-mail' },
        { name: 'buttonLabel', type: 'text', label: 'Bouton', defaultValue: 'S\'inscrire' },
        { name: 'successLabel', type: 'text', label: 'Bouton après inscription', defaultValue: 'Inscrit !' },
      ],
    },
    {
      name: 'partners',
      type: 'group',
      label: 'Section Partenaires',
      admin: { description: 'Les partenaires eux-mêmes se gèrent dans Contenu → Partenaires.' },
      fields: [{ name: 'eyebrow', type: 'text', label: 'Sur-titre', defaultValue: 'Avec le soutien de' }],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'Référencement',
      admin: { description: 'Titre et description de la page d\'accueil pour Google et les réseaux sociaux. Laisser vide pour utiliser ceux du site.' },
      fields: [
        { name: 'metaTitle', type: 'text', label: 'Titre de la page (onglet, Google)' },
        { name: 'metaDescription', type: 'textarea', label: 'Description (Google, réseaux sociaux)' },
      ],
    },
  ],
}
