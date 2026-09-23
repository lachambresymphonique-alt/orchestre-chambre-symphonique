import type { CollectionConfig } from 'payload';

/**
 * Journal des pages vues sur le site public.
 *
 * Alimenté par la route `POST /api/visite` (src/app/api/visite/route.ts) et
 * agrégé par `src/lib/stats.ts` pour la vue « Statistiques » de l'admin.
 *
 * Aucune donnée personnelle n'est conservée : ni adresse IP, ni cookie, ni
 * identifiant persistant. `visitor` est une empreinte anonyme (hachage salé
 * de l'IP et du navigateur) renouvelée chaque jour : elle sert uniquement à
 * compter un visiteur une seule fois par jour et ne permet pas de le suivre
 * d'un jour à l'autre.
 */
export const PageViews: CollectionConfig = {
  slug: 'page-views',
  labels: { singular: 'Page vue', plural: 'Pages vues' },
  admin: {
    // Les lignes brutes n'ont pas d'intérêt en liste : elles sont consultées
    // sous forme agrégée dans la vue « Statistiques » (/admin/statistiques).
    hidden: true,
    group: 'Réglages',
    useAsTitle: 'path',
    defaultColumns: ['path', 'referrer', 'device', 'createdAt'],
  },
  access: {
    // Insertion uniquement via l'API locale (route /api/visite), jamais via REST.
    create: () => false,
    read: ({ req }) => !!req.user,
    update: () => false,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    { name: 'path', type: 'text', label: 'Page', required: true },
    { name: 'referrer', type: 'text', label: 'Site de provenance', defaultValue: '' },
    // mobile | tablet | desktop
    { name: 'device', type: 'text', label: 'Appareil' },
    { name: 'visitor', type: 'text', label: 'Empreinte anonyme du jour', required: true },
    // Première page ouverte lors d'une visite (sert au classement des provenances).
    { name: 'entry', type: 'checkbox', label: 'Arrivée sur le site', defaultValue: false },
  ],
};
