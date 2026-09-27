import type { Field } from 'payload';
import { richTextAdmin } from '@/lib/richTextAdmin';

/**
 * Briques communes aux sections des pages (src/blocks/*).
 *
 * Chaque section a deux onglets : « Contenu » (le strict nécessaire) et
 * « Mise en forme » (sa variante, puis des réglages sûrs : fond, largeur,
 * espacement, ancre, masquer). Aucun choix libre de couleur, de police ni de
 * taille : la page ne peut pas sortir du dessin du site. Les valeurs sont
 * traduites en classes CSS par src/lib/sections.ts.
 */

export const SECTION_LABEL = '@/components/admin/SectionRowLabel#SectionRowLabel';

export const BACKGROUND_OPTIONS = [
  { label: 'Automatique', value: 'auto' },
  { label: 'Fond de la page', value: 'page' },
  { label: 'Nuancé', value: 'soft' },
  { label: 'Bandeau sombre', value: 'dark' },
];

export const WIDTH_OPTIONS = [
  { label: 'Automatique', value: 'auto' },
  { label: 'Colonne de lecture', value: 'narrow' },
  { label: 'Large', value: 'normal' },
  { label: 'Pleine largeur', value: 'wide' },
];

export const SPACING_OPTIONS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Resserré', value: 'tight' },
];

const validateAnchor = (value: unknown) => {
  if (typeof value !== 'string' || value.trim() === '') return true;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim())
    ? true
    : 'Minuscules, chiffres et tirets seulement (ex : programme).';
};

/** Lien d'un bouton ou d'une carte : page du site, ancre, adresse complète, e-mail. */
export const validateLink = (value: unknown) => {
  if (typeof value !== 'string' || value.trim() === '') return true;
  return /^(\/|#|https?:\/\/|mailto:|tel:)/.test(value.trim())
    ? true
    : 'Commencez par « / » (une page du site), « # » (une ancre) ou « https:// ».';
};

const settingsGroup: Field = {
  name: 'settings',
  type: 'group',
  label: 'Réglages',
  admin: { hideGutter: true },
  fields: [
    {
      name: 'background',
      type: 'radio',
      label: 'Fond',
      defaultValue: 'auto',
      options: BACKGROUND_OPTIONS,
      admin: { layout: 'horizontal', description: 'Automatique : le fond d’origine de ce type de section.' },
    },
    {
      name: 'width',
      type: 'radio',
      label: 'Largeur',
      defaultValue: 'auto',
      options: WIDTH_OPTIONS,
      admin: { layout: 'horizontal' },
    },
    {
      name: 'spacing',
      type: 'radio',
      label: 'Espacement',
      defaultValue: 'normal',
      options: SPACING_OPTIONS,
      admin: { layout: 'horizontal', description: 'Resserré : moins d’espace au-dessus et au-dessous.' },
    },
    {
      name: 'anchor',
      type: 'text',
      label: 'Ancre (lien direct)',
      validate: validateAnchor,
      admin: { description: 'Ex : « programme » permet un lien vers /ma-page#programme.' },
    },
    {
      name: 'hidden',
      type: 'checkbox',
      label: 'Masquer cette section (son contenu est conservé)',
      defaultValue: false,
    },
  ],
};

/** Variante de mise en page d'une section, en boutons radio. */
export function variantField(options: { label: string; value: string }[], defaultValue: string): Field {
  return {
    name: 'variant',
    type: 'radio',
    label: 'Mise en page',
    defaultValue,
    options,
    admin: { layout: 'horizontal' },
  };
}

/** Les deux onglets d'une section : contenu, puis mise en forme. */
export function sectionFields(content: Field[], layout: Field[] = []): Field[] {
  return [
    {
      type: 'tabs',
      tabs: [
        { label: 'Contenu', fields: content },
        { label: 'Mise en forme', fields: [...layout, settingsGroup] },
      ],
    },
  ];
}

export const eyebrowField: Field = {
  name: 'eyebrow',
  type: 'text',
  label: 'Sur-titre',
  admin: { description: 'Facultatif : petit texte en capitales au-dessus du titre.' },
};

export function titleField(required = false): Field {
  return {
    name: 'title',
    type: 'text',
    label: 'Titre',
    required,
    admin: {
      ...richTextAdmin('title'),
      description: 'Sélectionnez un mot puis « I » : il prendra la couleur d’accent du site.',
    },
  };
}

/** Un lien (texte + adresse), pour un bouton ou une carte. */
export function linkGroup(name: string, label: string, description?: string): Field {
  return {
    name,
    type: 'group',
    label,
    admin: { hideGutter: true, ...(description ? { description } : {}) },
    fields: [
      {
        type: 'row',
        fields: [
          { name: 'label', type: 'text', label: 'Texte du lien', admin: { width: '40%' } },
          {
            name: 'url',
            type: 'text',
            label: 'Adresse',
            validate: validateLink,
            admin: { width: '60%', placeholder: '/contact, /#concerts ou https://…' },
          },
        ],
      },
    ],
  };
}

/** Image obligatoire ou non, avec le rappel du texte alternatif. */
export function imageField(name: string, label: string, required = false): Field {
  return {
    name,
    type: 'upload',
    relationTo: 'media',
    label,
    required,
  };
}
