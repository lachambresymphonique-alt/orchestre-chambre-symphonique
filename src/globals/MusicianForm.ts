import type { GlobalConfig } from 'payload';

import {
  CORE_FIELDS,
  DEFAULT_HEADER,
  DEFAULT_OUTRO,
  DEFAULT_SEO,
  DEFAULT_SUCCESS,
  DEFAULT_UNDECIDED_LABEL,
  FIELD_CATALOGUE,
  SECTION_DEFAULT_LABELS,
  SECTION_VALUES,
  defaultPartsValue,
  fieldAdminLabel,
  isCoreField,
} from '@/lib/musicianForm';
import { richTextAdmin } from '@/lib/richTextAdmin';

/**
 * Formulaire musiciens — questions posées sur /musiciens/contribuer.
 *
 * Le catalogue des questions possibles vit dans `src/lib/musicianForm.ts` :
 * chacune correspond à un champ de la collection « Fiches musiciens reçues ».
 * On règle ici ce qui est demandé, dans quel ordre, avec quels mots.
 */
export const MusicianForm: GlobalConfig = {
  slug: 'musician-form',
  label: 'Formulaire musiciens',
  admin: {
    group: 'Pages',
    description:
      'Questions posées aux musiciens sur la page « Compléter ma fiche ». Retirez une question en supprimant sa ligne, remettez-la avec « Ajouter une question ».',
    components: {
      elements: {
        // « Partager le lien » : l'adresse du formulaire public, à côté de l'œil d'aperçu.
        beforeDocumentControls: ['@/components/admin/ShareFormButton#ShareFormButton'],
      },
    },
  },
  fields: [
    {
      name: 'header',
      type: 'group',
      label: 'En-tête de la page',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          label: 'Petite ligne au-dessus du titre',
          defaultValue: DEFAULT_HEADER.eyebrow,
        },
        {
          name: 'titleItalic',
          type: 'text',
          label: 'Titre — première ligne (en italique doré)',
          defaultValue: DEFAULT_HEADER.titleItalic,
        },
        {
          name: 'titleRest',
          type: 'text',
          label: 'Titre — seconde ligne',
          defaultValue: DEFAULT_HEADER.titleRest,
        },
      ],
    },

    {
      name: 'parts',
      type: 'array',
      label: 'Parties du formulaire',
      labels: { singular: 'Partie', plural: 'Parties' },
      admin: {
        description:
          'Le formulaire est découpé en parties numérotées (i, ii, iii…). Glissez les lignes pour changer l’ordre.',
        components: {
          RowLabel: '@/components/admin/MusicianFormRowLabel#MusicianFormPartRowLabel',
        },
      },
      defaultValue: defaultPartsValue,
      validate: (value: unknown) => {
        const parts = (Array.isArray(value) ? value : []) as { questions?: unknown }[];
        const keys: string[] = [];
        for (const part of parts) {
          const questions = Array.isArray(part?.questions) ? part.questions : [];
          for (const question of questions as { field?: unknown }[]) {
            const key = question?.field;
            if (typeof key === 'string' && key) keys.push(key);
          }
        }

        const duplicates = [...new Set(keys.filter((key, i) => keys.indexOf(key) !== i))];
        if (duplicates.length > 0) {
          const names = duplicates.map(fieldAdminLabel).join(', ');
          return `Cette question est posée deux fois : ${names}. Gardez-en une seule.`;
        }

        const missing = CORE_FIELDS.filter((key) => !keys.includes(key));
        if (missing.length > 0) {
          const names = missing.map(fieldAdminLabel).join(', ');
          return `Sans ces questions, aucune fiche ne peut être créée : ${names}. Merci de les conserver.`;
        }

        return true;
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Titre de la partie',
          required: true,
        },
        {
          name: 'lede',
          type: 'textarea',
          label: 'Phrase d’introduction',
          admin: { ...richTextAdmin('inline'), description: 'Facultative — laissez vide pour n’afficher que le titre.' },
        },
        {
          name: 'questions',
          type: 'array',
          label: 'Questions',
          labels: { singular: 'Question', plural: 'Questions' },
          admin: {
            initCollapsed: true,
            components: {
              RowLabel: '@/components/admin/MusicianFormRowLabel#MusicianFormQuestionRowLabel',
            },
          },
          fields: [
            {
              name: 'field',
              type: 'select',
              label: 'Information demandée',
              required: true,
              admin: {
                description:
                  'Détermine où la réponse est rangée dans la fiche reçue. Une même information ne peut être demandée qu’une fois.',
              },
              options: FIELD_CATALOGUE.map((entry) => ({
                label: entry.adminLabel,
                value: entry.key,
              })),
            },
            {
              name: 'label',
              type: 'text',
              label: 'Question telle qu’elle s’affiche',
              required: true,
            },
            {
              name: 'hint',
              type: 'text',
              label: 'Précision sous le champ',
              admin: { description: 'Facultative — petite ligne grise sous la réponse.' },
            },
            {
              name: 'placeholder',
              type: 'text',
              label: 'Exemple affiché en gris dans le champ',
              admin: {
                condition: (_, siblingData) =>
                  siblingData?.field !== 'section' && siblingData?.field !== 'photo',
              },
            },
            {
              name: 'width',
              type: 'select',
              label: 'Largeur',
              defaultValue: 'full',
              options: [
                { label: 'Toute la largeur', value: 'full' },
                { label: 'Demi-largeur (deux questions côte à côte)', value: 'half' },
              ],
              admin: {
                description:
                  'Deux demi-largeurs qui se suivent se placent côte à côte. Une demi-largeur isolée reprend toute la largeur.',
                condition: (_, siblingData) =>
                  siblingData?.field !== 'section' && siblingData?.field !== 'photo',
              },
            },
            {
              name: 'required',
              type: 'checkbox',
              label: 'Réponse obligatoire',
              defaultValue: false,
              admin: {
                description: 'Le musicien ne pourra pas envoyer sa fiche sans y répondre.',
                // Prénom, nom, e-mail et rôle sont toujours obligatoires.
                condition: (_, siblingData) => !isCoreField(siblingData?.field),
              },
            },
            {
              name: 'coreNote',
              type: 'ui',
              admin: {
                condition: (_, siblingData) => isCoreField(siblingData?.field),
                components: {
                  Field: '@/components/admin/MusicianFormRowLabel#MusicianFormCoreNote',
                },
              },
            },

            // ── Questions de type « section » ──────────────────────────────
            {
              name: 'sectionChoices',
              type: 'array',
              label: 'Pupitres proposés',
              labels: { singular: 'Pupitre', plural: 'Pupitres' },
              admin: {
                description:
                  'Supprimez une ligne pour retirer le choix, glissez pour réordonner. Les pupitres disponibles sont ceux de la page Musiciens.',
                condition: (_, siblingData) => siblingData?.field === 'section',
                components: {
                  RowLabel: '@/components/admin/MusicianFormRowLabel#MusicianFormChoiceRowLabel',
                },
              },
              defaultValue: SECTION_VALUES.map((value) => ({
                value,
                label: SECTION_DEFAULT_LABELS[value],
              })),
              fields: [
                {
                  name: 'value',
                  type: 'select',
                  label: 'Pupitre',
                  required: true,
                  options: SECTION_VALUES.map((value) => ({
                    label: SECTION_DEFAULT_LABELS[value],
                    value,
                  })),
                },
                {
                  name: 'label',
                  type: 'text',
                  label: 'Intitulé affiché sur le formulaire',
                  required: true,
                },
              ],
            },
            {
              name: 'undecidedEnabled',
              type: 'checkbox',
              label: 'Proposer aussi un choix « sans préférence »',
              defaultValue: false,
              admin: {
                description:
                  'Le musicien peut alors ne pas choisir de pupitre. La fiche arrive sans section, à classer à la main.',
                condition: (_, siblingData) => siblingData?.field === 'section',
              },
            },
            {
              name: 'undecidedLabel',
              type: 'text',
              label: 'Intitulé du choix « sans préférence »',
              defaultValue: DEFAULT_UNDECIDED_LABEL,
              admin: {
                condition: (_, siblingData) =>
                  siblingData?.field === 'section' && siblingData?.undecidedEnabled === true,
              },
            },
          ],
        },
      ],
    },

    {
      name: 'outro',
      type: 'group',
      label: 'Bas du formulaire',
      fields: [
        {
          name: 'line',
          type: 'text',
          label: 'Phrase de remerciement',
          defaultValue: DEFAULT_OUTRO.line,
        },
        {
          name: 'submitLabel',
          type: 'text',
          label: 'Texte du bouton d’envoi',
          defaultValue: DEFAULT_OUTRO.submitLabel,
        },
        {
          name: 'fallback',
          type: 'text',
          label: 'Phrase « en cas de blocage »',
          defaultValue: DEFAULT_OUTRO.fallback,
        },
        {
          name: 'fallbackLinkLabel',
          type: 'text',
          label: 'Texte du lien de contact',
          defaultValue: DEFAULT_OUTRO.fallbackLinkLabel,
        },
      ],
    },

    {
      name: 'success',
      type: 'group',
      label: 'Message après envoi',
      admin: { description: 'Ce que le musicien lit une fois sa fiche envoyée.' },
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          label: 'Petite ligne au-dessus',
          defaultValue: DEFAULT_SUCCESS.eyebrow,
        },
        {
          name: 'titleItalic',
          type: 'text',
          label: 'Titre — mot en italique',
          defaultValue: DEFAULT_SUCCESS.titleItalic,
        },
        {
          name: 'title',
          type: 'text',
          label: 'Titre — suite',
          defaultValue: DEFAULT_SUCCESS.title,
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Texte',
          defaultValue: DEFAULT_SUCCESS.body,
          admin: { ...richTextAdmin('inline') },
        },
      ],
    },

    {
      name: 'seo',
      type: 'group',
      label: 'Référencement',
      admin: {
        description: 'La page n’est pas indexée par Google ; ces textes servent à l’onglet du navigateur et aux aperçus de lien.',
      },
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          label: 'Titre de la page (onglet)',
          defaultValue: DEFAULT_SEO.metaTitle,
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Description',
          defaultValue: DEFAULT_SEO.metaDescription,
        },
      ],
    },
  ],
};
