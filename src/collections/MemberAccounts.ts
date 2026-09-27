import type { CollectionConfig, FieldAccess } from 'payload';

/**
 * Accès à l'espace membres (/espace-membres) : un compte par fiche du
 * collectif — musiciens, bureau, équipe technique.
 *
 * Ce ne sont PAS des comptes Payload (pas d'`auth`) : ils n'ouvrent ni
 * l'administration ni l'API, et `req.user` reste vide pour eux. La connexion
 * se fait par un lien envoyé par e-mail, et la session est un cookie signé
 * propre au site (src/lib/memberSession.ts). Toutes les opérations de la
 * collection sont réservées aux administrateurs (adminByDefault).
 *
 * L'adresse e-mail vit ici et non sur la fiche musicien : la page publique
 * /musiciens transmet les fiches entières au navigateur.
 */

/** Champs techniques : lus et écrits seulement par le serveur (API locale). */
const serverOnly: { read: FieldAccess; create: FieldAccess; update: FieldAccess } = {
  read: () => false,
  create: () => false,
  update: () => false,
};

export const MemberAccounts: CollectionConfig = {
  slug: 'member-accounts',
  labels: { singular: 'Accès membre', plural: 'Accès membres' },
  admin: {
    useAsTitle: 'email',
    group: 'Réglages',
    description:
      'Comptes de l’espace membres (musiciens, bureau, équipe technique). On invite quelqu’un depuis sa fiche dans Musiciens. Ces comptes n’ont aucun accès à l’administration.',
    defaultColumns: ['email', 'musician', 'status', 'lastLoginAt'],
  },
  defaultSort: '-updatedAt',
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        if (typeof data.email === 'string') data.email = data.email.trim().toLowerCase();
        // Désactiver un compte ferme ses sessions ouvertes et annule son lien en cours.
        if (data.status === 'desactive' && originalDoc?.status !== 'desactive') {
          data.sessionVersion = (Number(originalDoc?.sessionVersion) || 0) + 1;
          data.loginTokenHash = null;
          data.loginTokenExpiresAt = null;
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      label: 'Adresse e-mail',
      admin: { description: 'Le lien de connexion est envoyé à cette adresse.' },
    },
    {
      name: 'musician',
      type: 'relationship',
      relationTo: 'musicians',
      required: true,
      unique: true,
      label: 'Fiche',
      admin: { description: 'La fiche que cette personne retrouve dans son espace.' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'invite',
      label: 'Statut',
      admin: {
        position: 'sidebar',
        description: 'Désactiver un compte le déconnecte aussitôt et annule son lien en cours.',
      },
      options: [
        { label: 'Invité·e (lien pas encore ouvert)', value: 'invite' },
        { label: 'Actif', value: 'actif' },
        { label: 'Désactivé', value: 'desactive' },
      ],
    },
    {
      name: 'invitedAt',
      type: 'date',
      label: 'Invité·e le',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy à HH:mm' },
      },
    },
    {
      name: 'lastLoginAt',
      type: 'date',
      label: 'Dernière connexion',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy à HH:mm' },
      },
    },
    // Empreinte SHA-256 du dernier lien envoyé (jamais le lien lui-même).
    { name: 'loginTokenHash', type: 'text', index: true, access: serverOnly, admin: { hidden: true } },
    { name: 'loginTokenExpiresAt', type: 'date', access: serverOnly, admin: { hidden: true } },
    { name: 'loginTokenIssuedAt', type: 'date', access: serverOnly, admin: { hidden: true } },
    // Incrémenté à chaque désactivation : invalide les cookies de session déjà émis.
    { name: 'sessionVersion', type: 'number', defaultValue: 0, access: serverOnly, admin: { hidden: true } },
  ],
};
