import type { CollectionConfig } from 'payload';
import { isAdmin } from '@/lib/access';

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  labels: { singular: 'Message reçu', plural: 'Messages reçus' },
  admin: {
    group: 'Messages reçus',
    description: 'Messages envoyés via le formulaire de contact du site.',
    useAsTitle: 'subject',
    defaultColumns: ['name', 'email', 'phone', 'subject', 'createdAt'],
  },
  access: {
    // Les messages n'arrivent que par la route /api/contact (API locale, hors
    // contrôle d'accès), qui applique pot de miel, délai minimal et captcha.
    // L'API REST publique refuse donc les créations anonymes : sans cela, un
    // robot contournerait le formulaire en postant sur /api/contact-submissions.
    create: isAdmin,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', label: 'Nom', required: true },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email', label: 'E-mail', required: true, admin: { width: '50%' } },
        // Exigé par le formulaire (/api/contact), mais pas en base : les messages
        // reçus avant son ajout n'en ont pas.
        { name: 'phone', type: 'text', label: 'Téléphone', admin: { width: '50%' } },
      ],
    },
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
