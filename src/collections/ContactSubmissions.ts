import type { CollectionConfig } from 'payload';

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  labels: { singular: 'Message reçu', plural: 'Messages reçus' },
  admin: {
    group: 'Messages reçus',
    description: 'Messages envoyés via le formulaire de contact du site.',
    useAsTitle: 'subject',
    defaultColumns: ['name', 'email', 'subject', 'createdAt'],
  },
  access: {
    create: () => true,
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    { name: 'name', type: 'text', label: 'Nom', required: true },
    { name: 'email', type: 'email', label: 'E-mail', required: true },
    {
      name: 'subject',
      type: 'select',
      label: 'Objet',
      required: true,
      options: [
        { label: "Demande d'information", value: 'info' },
        { label: 'Réservation / Billetterie', value: 'reservation' },
        { label: 'Mécénat / Partenariat', value: 'mecenat' },
        { label: 'Presse / Médias', value: 'presse' },
        { label: 'Programmation / Booking', value: 'programmation' },
        { label: 'Bénévolat', value: 'benevolat' },
        { label: 'Autre', value: 'autre' },
      ],
    },
    { name: 'message', type: 'textarea', label: 'Message', required: true },
  ],
};
