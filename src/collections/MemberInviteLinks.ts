import type { CollectionConfig } from 'payload';
import { randomBytes } from 'node:crypto';
import { JOIN_ROLES } from '@/lib/pupitres';

/**
 * Liens d'inscription à l'espace membres, un par rôle, que l'équipe partage
 * dans ses discussions (WhatsApp de l'orchestre, de l'équipe technique…).
 *
 * Le lien ne donne aucun accès par lui-même : la personne qui l'ouvre envoie
 * une demande (nom, e-mail, pupitre), que l'équipe valide dans « Demandes
 * d'accès ». Un lien qui a circulé hors du groupe se désactive d'un clic.
 */
export const MemberInviteLinks: CollectionConfig = {
  slug: 'member-invite-links',
  labels: { singular: 'Lien d’inscription', plural: 'Liens d’inscription' },
  admin: {
    useAsTitle: 'label',
    group: 'Espace membres',
    description:
      'Liens à partager dans une discussion de groupe. Ils ne donnent aucun accès par eux-mêmes : chaque inscription arrive dans « Demandes d’accès », à valider.',
    defaultColumns: ['label', 'role', 'active', 'updatedAt'],
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        // Code imprévisible, attribué à la création et jamais modifié ensuite.
        if (operation === 'create' && data && !data.code) data.code = randomBytes(12).toString('base64url');
        return data;
      },
    ],
  },
  fields: [
    {
      name: 'share',
      type: 'ui',
      admin: { components: { Field: '@/components/admin/InviteLinkField#InviteLinkField' } },
    },
    {
      name: 'label',
      type: 'text',
      required: true,
      label: 'Nom du lien',
      admin: { description: 'Pour vous y retrouver, par exemple « Discussion WhatsApp de l’orchestre ».' },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      label: 'Pour',
      options: JOIN_ROLES.map((r) => ({ label: r.label, value: r.value })),
      admin: { description: 'Musiciens : chacun indique son pupitre en s’inscrivant.' },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Lien actif',
      admin: {
        position: 'sidebar',
        description: 'Décochez si le lien a circulé hors du groupe : il ne marchera plus. Créez-en un nouveau pour le remplacer.',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      label: 'Valable jusqu’au',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' },
        description: 'Facultatif. Laisser vide : sans limite.',
      },
    },
    { name: 'code', type: 'text', unique: true, index: true, admin: { hidden: true, readOnly: true } },
  ],
};
