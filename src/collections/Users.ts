import type { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // Connexion gardée 30 jours sur le même navigateur (2 heures par défaut
    // dans Payload : il fallait se reconnecter après chaque pause). Tant que
    // l'admin est ouvert, elle est renouvelée d'elle-même (autoRefresh dans
    // payload.config.ts).
    tokenExpiration: 60 * 60 * 24 * 30,
  },
  labels: { singular: 'Utilisateur', plural: 'Utilisateurs' },
  admin: {
    useAsTitle: 'email',
    group: 'Réglages',
    description: 'Comptes ayant accès au panneau d\'administration.',
  },
  fields: [{ name: 'name', type: 'text', label: 'Nom complet' }],
};
