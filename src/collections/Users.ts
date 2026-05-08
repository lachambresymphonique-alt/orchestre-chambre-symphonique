import type { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  labels: { singular: 'Utilisateur', plural: 'Utilisateurs' },
  admin: {
    useAsTitle: 'email',
    group: 'Réglages',
    description: 'Comptes ayant accès au panneau d\'administration.',
  },
  fields: [{ name: 'name', type: 'text', label: 'Nom complet' }],
};
