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
    // Les messages n'arrivent que par la route /api/contact (API locale, hors
    // contrôle d'accès), qui applique pot de miel, délai minimal et captcha.
    // L'API REST publique refuse donc les créations anonymes : sans cela, un
    // robot contournerait le formulaire en postant sur /api/contact-submissions.
    create: ({ req }) => !!req.user,
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
