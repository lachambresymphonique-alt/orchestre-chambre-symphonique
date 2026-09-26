import type { GlobalConfig } from 'payload'
import { richTextAdmin } from '@/lib/richTextAdmin'

export const SupportPage: GlobalConfig = {
  slug: 'support-page',
  label: 'Page Nous soutenir',
  admin: {
    group: 'Pages',
    description: 'Contenu de la page Nous soutenir : formes de soutien et avantages fiscaux.',
  },
  fields: [
    {
      name: 'header',
      type: 'group',
      label: 'En-tête de page',
      fields: [
        { name: 'title', type: 'text', label: 'Titre', defaultValue: 'Nous soutenir' },
        {
          name: 'lede',
          type: 'textarea',
          label: 'Phrase d\'introduction',
          defaultValue: 'Votre soutien est essentiel pour faire vivre la musique et la rendre accessible à tous.',
          admin: { ...richTextAdmin('inline') },
        },
      ],
    },
    {
      name: 'supportTypesHeading',
      type: 'group',
      label: 'Titres — Formes de soutien',
      fields: [
        { name: 'subtitle', type: 'text', label: 'Sur-titre', defaultValue: 'Comment nous aider' },
        { name: 'title', type: 'text', label: 'Titre', defaultValue: 'Les formes de soutien' },
      ],
    },
    {
      name: 'supportTypes',
      type: 'array',
      label: 'Formes de soutien',
      maxRows: 4,
      admin: { description: 'Les différentes façons de soutenir l\'orchestre (adhésion, don, bénévolat…). Maximum 4.' },
      fields: [
        { name: 'title', type: 'text', required: true, label: 'Titre', admin: { description: 'Ex : « Adhérer à l\'association »' } },
        { name: 'description', type: 'textarea', required: true, label: 'Description', admin: { ...richTextAdmin('prose') } },
        { name: 'ctaText', type: 'text', required: true, label: 'Texte du bouton', admin: { description: 'Ex : « Adhérer maintenant »' } },
        { name: 'ctaLink', type: 'text', required: true, label: 'Lien du bouton', admin: { description: 'URL vers la page d\'action (ex : HelloAsso).' } },
      ],
    },
    {
      name: 'taxInfo',
      type: 'group',
      label: 'Avantage fiscal',
      admin: { description: 'Informations sur la déductibilité fiscale des dons.' },
      fields: [
        { name: 'subtitle', type: 'text', label: 'Sur-titre' },
        { name: 'title', type: 'text', label: 'Titre' },
        { name: 'description', type: 'textarea', label: 'Description', admin: { ...richTextAdmin('prose'), description: 'Explication du dispositif fiscal.' } },
        {
          name: 'individualRate',
          type: 'text',
          label: 'Taux de réduction (particuliers)',
          defaultValue: '66%',
          admin: { description: 'Pourcentage de réduction d\'impôt pour les particuliers.' },
        },
        {
          name: 'corporateRate',
          type: 'text',
          label: 'Taux de réduction (entreprises)',
          defaultValue: '60%',
          admin: { description: 'Pourcentage de réduction d\'impôt pour les entreprises.' },
        },
        { name: 'individualLabel', type: 'text', label: 'Libellé particuliers', defaultValue: 'Particuliers' },
        { name: 'corporateLabel', type: 'text', label: 'Libellé entreprises', defaultValue: 'Entreprises' },
        {
          name: 'example',
          type: 'text',
          label: 'Exemple concret',
          admin: { description: 'Ex : « Un don de 100€ ne vous coûte que 34€ après réduction »' },
        },
      ],
    },
    {
      name: 'simulator',
      type: 'group',
      label: 'Simulateur de don',
      admin: { description: 'Le bloc interactif « Que permet votre don ? ». Les paliers décrivent ce qu\'un montant finance.' },
      fields: [
        { name: 'enabled', type: 'checkbox', label: 'Afficher le simulateur', defaultValue: true },
        { name: 'eyebrow', type: 'text', label: 'Sur-titre', defaultValue: 'Simulateur de don' },
        {
          name: 'title',
          type: 'text',
          label: 'Titre',
          defaultValue: 'Que *permet* votre don ?',
          admin: { ...richTextAdmin('title'), description: 'Sélectionnez un mot puis « I » pour le mettre en italique coloré.' },
        },
        {
          name: 'lede',
          type: 'textarea',
          label: 'Phrase d\'introduction',
          defaultValue:
            'Choisissez un montant et découvrez son impact concret pour l\'orchestre, ainsi que son coût réel après déduction fiscale.',
          admin: { ...richTextAdmin('inline') },
        },
        {
          type: 'row',
          fields: [
            { name: 'individualLabel', type: 'text', label: 'Onglet particulier', defaultValue: 'Particulier', admin: { width: '50%' } },
            { name: 'corporateLabel', type: 'text', label: 'Onglet entreprise', defaultValue: 'Entreprise', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'individualRate', type: 'number', label: 'Réduction particulier (%)', defaultValue: 66, min: 0, max: 100, admin: { width: '50%' } },
            { name: 'corporateRate', type: 'number', label: 'Réduction entreprise (%)', defaultValue: 60, min: 0, max: 100, admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'individualLimit', type: 'text', label: 'Plafond particulier', defaultValue: '20 % du revenu imposable', admin: { width: '50%' } },
            { name: 'corporateLimit', type: 'text', label: 'Plafond entreprise', defaultValue: '5 ‰ du chiffre d\'affaires', admin: { width: '50%' } },
          ],
        },
        { name: 'amountLabel', type: 'text', label: 'Libellé du montant', defaultValue: 'Votre don' },
        { name: 'realCostLabel', type: 'text', label: 'Libellé coût réel', defaultValue: 'Coût réel pour vous' },
        { name: 'savingLabel', type: 'text', label: 'Libellé économie d\'impôt', defaultValue: 'Économie d\'impôt' },
        {
          name: 'impactIntro',
          type: 'text',
          label: 'Phrase d\'impact',
          defaultValue: 'Avec {montant}, vous offrez à l\'orchestre',
          admin: { description: '{montant} est remplacé par la somme choisie.' },
        },
        {
          name: 'ctaText',
          type: 'text',
          label: 'Bouton de don — texte',
          defaultValue: 'Faire ce don de {montant}',
          admin: { description: '{montant} est remplacé par la somme choisie.' },
        },
        {
          name: 'ctaLink',
          type: 'text',
          label: 'Bouton de don — lien',
          defaultValue: 'https://www.helloasso.com/associations/la-chambre-symphonique',
          admin: { description: 'Page de don en ligne (HelloAsso…).' },
        },
        {
          name: 'presets',
          type: 'array',
          label: 'Montants proposés',
          labels: { singular: 'Montant', plural: 'Montants' },
          maxRows: 8,
          defaultValue: [{ amount: 50 }, { amount: 150 }, { amount: 500 }, { amount: 1500 }, { amount: 3000 }, { amount: 6000 }],
          fields: [{ name: 'amount', type: 'number', required: true, label: 'Montant (€)', min: 1 }],
        },
        {
          name: 'impacts',
          type: 'array',
          label: 'Paliers d\'impact',
          labels: { singular: 'Palier', plural: 'Paliers' },
          admin: { description: 'Du plus petit au plus grand montant : ce que ce don permet de financer.' },
          defaultValue: [
            { threshold: 30, icon: 'score', title: 'Une partition imprimée', description: 'L\'édition d\'un cahier de musique pour un pupitre de l\'orchestre.' },
            { threshold: 100, icon: 'transport', title: 'Le déplacement d\u2019un musicien', description: 'Le trajet aller-retour d\u2019un instrumentiste pour un concert en région.' },
            { threshold: 300, icon: 'rehearsal', title: 'Une heure de salle acoustique', description: 'Une heure de location d\'une salle de répétition adaptée à l\'orchestre.' },
            { threshold: 800, icon: 'meal', title: 'Le repas de l\u2019orchestre', description: 'Le déjeuner de l\u2019ensemble des musiciens lors d\u2019une journée de répétition.' },
            { threshold: 1500, icon: 'piano', title: 'Une journée de répétition', description: 'La location complète d\'une salle pour une journée de travail collectif (matinée + après-midi).' },
            { threshold: 3000, icon: 'soloist', title: 'Un soliste invité', description: 'Le cachet d\'un soliste de renom pour un concert ou une masterclass.' },
            { threshold: 6000, icon: 'venue', title: 'Une salle de concert', description: 'La location d\'une grande salle pour une représentation publique en région.' },
            { threshold: 12000, icon: 'recording', title: 'Un enregistrement studio', description: 'L\'enregistrement professionnel d\'une œuvre majeure du répertoire.' },
            { threshold: 25000, icon: 'tour', title: 'Une tournée régionale', description: 'Un week-end de tournée pour l\u2019ensemble de l\u2019orchestre — logistique, transports, hébergement.' },
          ],
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'threshold', type: 'number', required: true, label: 'À partir de (€)', min: 1, admin: { width: '40%' } },
                {
                  name: 'icon',
                  type: 'select',
                  label: 'Icône',
                  defaultValue: 'score',
                  admin: { width: '60%' },
                  options: [
                    { label: 'Partition', value: 'score' },
                    { label: 'Transport', value: 'transport' },
                    { label: 'Salle de répétition', value: 'rehearsal' },
                    { label: 'Repas', value: 'meal' },
                    { label: 'Piano / journée', value: 'piano' },
                    { label: 'Soliste', value: 'soloist' },
                    { label: 'Salle de concert', value: 'venue' },
                    { label: 'Enregistrement', value: 'recording' },
                    { label: 'Tournée', value: 'tour' },
                  ],
                },
              ],
            },
            { name: 'title', type: 'text', required: true, label: 'Titre', admin: { description: 'Ex : « Une partition imprimée »' } },
            { name: 'description', type: 'text', label: 'Description' },
          ],
        },
      ],
    },
    {
      name: 'tiersHeading',
      type: 'group',
      label: 'Titres — Cercles de soutien',
      admin: { description: 'Les cercles eux-mêmes se gèrent dans Contenu → Formules de soutien.' },
      fields: [
        { name: 'subtitle', type: 'text', label: 'Sur-titre', defaultValue: 'Cercle des mécènes' },
        { name: 'title', type: 'text', label: 'Titre', defaultValue: 'Nos cercles de soutien' },
        {
          name: 'amountTemplate',
          type: 'text',
          label: 'Mention du montant',
          defaultValue: 'À partir de {montant} € par an',
          admin: { description: '{montant} est remplacé par le montant minimum du cercle.' },
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'Référencement',
      fields: [
        { name: 'metaTitle', type: 'text', label: 'Titre de la page (onglet, Google)', defaultValue: 'Nous soutenir — La Chambre Symphonique' },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Description (Google, réseaux sociaux)',
          defaultValue: 'Soutenez La Chambre Symphonique par une adhésion, un don ou du bénévolat. Association bénévole d\'intérêt général.',
        },
      ],
    },
  ],
}
