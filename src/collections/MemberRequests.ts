import type { CollectionConfig } from 'payload';
import { JOIN_ROLES, PUPITRES } from '@/lib/pupitres';

/**
 * Demandes d'accès à l'espace membres, envoyées depuis un lien d'inscription
 * (/espace-membres/rejoindre/:code). Rien n'est ouvert avant la décision de
 * l'équipe (MemberRequestReview) : accepter relie la demande à une fiche
 * existante ou en crée une, puis envoie le lien de connexion.
 */
export const MemberRequests: CollectionConfig = {
  slug: 'member-requests',
  labels: { singular: 'Demande d’accès', plural: 'Demandes d’accès' },
  admin: {
    useAsTitle: 'title',
    group: 'Espace membres',
    description:
      'Inscriptions reçues par les liens partagés. Acceptez pour relier la personne à sa fiche (ou la créer) et lui envoyer son lien de connexion.',
    defaultColumns: ['title', 'role', 'pupitre', 'status', 'createdAt'],
    components: {
      edit: {
        beforeDocumentControls: ['@/components/admin/MemberRequestReview#MemberRequestReview'],
      },
    },
  },
  defaultSort: '-createdAt',
  fields: [
    { name: 'title', type: 'text', label: 'Nom', admin: { hidden: true } },
    { name: 'firstName', type: 'text', required: true, label: 'Prénom' },
    { name: 'lastName', type: 'text', required: true, label: 'Nom' },
    { name: 'email', type: 'email', required: true, label: 'Adresse e-mail' },
    {
      name: 'role',
      type: 'select',
      required: true,
      label: 'Inscrit·e comme',
      options: JOIN_ROLES.map((r) => ({ label: r.label, value: r.value })),
      admin: { readOnly: true },
    },
    {
      name: 'pupitre',
      type: 'select',
      label: 'Pupitre',
      options: PUPITRES.map((p) => ({ label: p.label, value: p.value })),
    },
    { name: 'message', type: 'textarea', label: 'Message', admin: { readOnly: true } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'nouvelle',
      label: 'Statut',
      admin: { position: 'sidebar', readOnly: true },
      options: [
        { label: 'À valider', value: 'nouvelle' },
        { label: 'Acceptée', value: 'acceptee' },
        { label: 'Refusée', value: 'refusee' },
      ],
    },
    {
      name: 'musician',
      type: 'relationship',
      relationTo: 'musicians',
      label: 'Fiche',
      admin: { position: 'sidebar', readOnly: true, description: 'Renseignée à l’acceptation.' },
    },
    {
      name: 'link',
      type: 'relationship',
      relationTo: 'member-invite-links',
      label: 'Arrivée par',
      admin: { position: 'sidebar', readOnly: true },
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
  ],
};
