import type { CollectionConfig, Field } from 'payload';
import { richTextAdmin } from '@/lib/richTextAdmin';
import { PROFILE_FIELDS, type ProfileFieldName } from '@/lib/profileFields';

/**
 * Modifications de fiche proposées par les membres depuis /espace-membres.
 *
 * Rien n'est publié tant qu'un administrateur n'a pas cliqué « Appliquer à la
 * fiche » (src/components/admin/ProfileChangeReview.tsx). Une seule
 * proposition en attente par personne : un nouvel envoi la remplace.
 *
 * Les valeurs proposées sont de vrais champs, que l'admin peut corriger avant
 * d'appliquer ; seuls ceux cochés dans « Champs modifiés » sont appliqués.
 * `base` garde la valeur en ligne au moment de l'envoi : si l'équipe a changé
 * ce champ entre-temps, l'écran de validation le signale.
 */

/** N'affiche un champ proposé que s'il fait partie de la modification. */
const shownIfChanged = (name: ProfileFieldName) => ({
  condition: (data: Record<string, unknown>) =>
    Array.isArray(data?.changedFields) && (data.changedFields as string[]).includes(name),
});

const lines = (name: ProfileFieldName, label: string): Field => ({
  name,
  type: 'array',
  label,
  labels: { singular: 'Entrée', plural: 'Entrées' },
  admin: shownIfChanged(name),
  fields: [{ name: 'item', type: 'text', required: true, label: 'Texte' }],
});

export const ProfileChanges: CollectionConfig = {
  slug: 'profile-changes',
  labels: { singular: 'Modification proposée', plural: 'Modifications proposées' },
  admin: {
    useAsTitle: 'title',
    group: 'Messages reçus',
    description:
      'Modifications de fiche envoyées par les membres depuis leur espace. Rien n’est publié avant « Appliquer à la fiche ».',
    defaultColumns: ['title', 'changedFields', 'status', 'submittedAt'],
    components: {
      edit: {
        beforeDocumentControls: ['@/components/admin/ProfileChangeReview#ProfileChangeReview'],
      },
    },
  },
  defaultSort: '-submittedAt',
  fields: [
    {
      name: 'comparison',
      type: 'ui',
      admin: { components: { Field: '@/components/admin/ProfileChangeDiff#ProfileChangeDiff' } },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Membre',
      admin: { hidden: true },
    },
    {
      name: 'musician',
      type: 'relationship',
      relationTo: 'musicians',
      required: true,
      label: 'Fiche',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'account',
      type: 'relationship',
      relationTo: 'member-accounts',
      label: 'Envoyée par',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'en-attente',
      label: 'Statut',
      admin: { position: 'sidebar', readOnly: true },
      options: [
        { label: 'En attente', value: 'en-attente' },
        { label: 'Appliquée', value: 'appliquee' },
        { label: 'Refusée', value: 'refusee' },
      ],
    },
    {
      name: 'submittedAt',
      type: 'date',
      label: 'Envoyée le',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy à HH:mm' },
      },
    },
    {
      name: 'decidedAt',
      type: 'date',
      label: 'Traitée le',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy à HH:mm' },
      },
    },
    {
      name: 'changedFields',
      type: 'select',
      hasMany: true,
      label: 'Champs modifiés',
      admin: {
        description: 'Seuls ces champs seront recopiés dans la fiche. Retirez-en un pour l’écarter.',
      },
      options: PROFILE_FIELDS.map((f) => ({ label: f.label, value: f.name })),
    },
    { name: 'name', type: 'text', label: 'Nom complet', admin: shownIfChanged('name') },
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Photo', admin: shownIfChanged('photo') },
    { name: 'tagline', type: 'text', label: 'Phrase signature', admin: shownIfChanged('tagline') },
    { name: 'instagram', type: 'text', label: 'Instagram', admin: shownIfChanged('instagram') },
    {
      name: 'bio',
      type: 'textarea',
      label: 'Biographie',
      admin: { ...richTextAdmin('prose'), ...shownIfChanged('bio') },
    },
    {
      name: 'inspiringSymphony',
      type: 'text',
      label: 'La symphonie qui lui a donné envie de faire de la musique',
      admin: shownIfChanged('inspiringSymphony'),
    },
    { name: 'favoriteWork', type: 'text', label: 'Œuvre préférée', admin: shownIfChanged('favoriteWork') },
    { name: 'favoriteComposer', type: 'text', label: 'Compositeur préféré', admin: shownIfChanged('favoriteComposer') },
    lines('formation', 'Formation'),
    lines('concours', 'Concours et distinctions'),
    { name: 'videoUrl', type: 'text', label: 'Vidéo', admin: shownIfChanged('videoUrl') },
    {
      name: 'quote',
      type: 'textarea',
      label: 'Citation',
      admin: { ...richTextAdmin('inline'), ...shownIfChanged('quote') },
    },
    {
      name: 'reviewNote',
      type: 'textarea',
      label: 'Message au membre',
      admin: {
        description: 'Motif d’un refus, ou mot joint à la publication : le membre le lit dans son espace.',
      },
    },
    // Valeurs en ligne au moment de l'envoi, pour repérer un changement de l'équipe entre-temps.
    { name: 'base', type: 'json', admin: { hidden: true } },
  ],
};
