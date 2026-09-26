import type { GlobalConfig } from 'payload';
import { richTextAdmin } from '@/lib/richTextAdmin';

export const ContactPage: GlobalConfig = {
  slug: 'contact-page',
  label: 'Page Contact',
  admin: {
    group: 'Pages',
    description:
      'Textes de la page Contact et du formulaire. Les coordonnées, horaires et réseaux sociaux se règlent dans Réglages → Paramètres du site.',
  },
  fields: [
    {
      name: 'header',
      type: 'group',
      label: 'En-tête de page',
      fields: [
        { name: 'title', type: 'text', label: 'Titre', defaultValue: 'Contactez-nous' },
        {
          name: 'lede',
          type: 'textarea',
          label: 'Phrase d\'introduction',
          defaultValue: 'Une question, une demande de partenariat ou de réservation ? N\'hésitez pas à nous écrire.',
          admin: { ...richTextAdmin('inline') },
        },
      ],
    },
    {
      name: 'info',
      type: 'group',
      label: 'Colonne d\'informations — titres',
      fields: [
        { name: 'coordinatesTitle', type: 'text', label: 'Titre coordonnées', defaultValue: 'Coordonnées' },
        { name: 'hoursTitle', type: 'text', label: 'Titre horaires', defaultValue: 'Horaires d\'ouverture' },
        { name: 'socialTitle', type: 'text', label: 'Titre réseaux sociaux', defaultValue: 'Suivez-nous' },
      ],
    },
    {
      name: 'form',
      type: 'group',
      label: 'Formulaire',
      fields: [
        { name: 'eyebrow', type: 'text', label: 'Sur-titre', defaultValue: 'Écrivez-nous' },
        {
          name: 'title',
          type: 'text',
          label: 'Titre',
          defaultValue: '*Un mot,* une question',
          admin: { ...richTextAdmin('title'), description: 'Sélectionnez un mot puis « I » pour le mettre en italique coloré.' },
        },
        {
          type: 'row',
          fields: [
            { name: 'nameLabel', type: 'text', label: 'Champ nom — libellé', defaultValue: 'Nom complet', admin: { width: '50%' } },
            { name: 'namePlaceholder', type: 'text', label: 'Champ nom — exemple', defaultValue: 'Votre nom et prénom', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'emailLabel', type: 'text', label: 'Champ e-mail — libellé', defaultValue: 'Adresse e-mail', admin: { width: '50%' } },
            { name: 'emailPlaceholder', type: 'text', label: 'Champ e-mail — exemple', defaultValue: 'votre@email.fr', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'subjectLabel', type: 'text', label: 'Champ objet — libellé', defaultValue: 'Objet', admin: { width: '50%' } },
            { name: 'subjectPlaceholder', type: 'text', label: 'Champ objet — invite', defaultValue: 'Choisissez un sujet', admin: { width: '50%' } },
          ],
        },
        {
          name: 'subjects',
          type: 'array',
          label: 'Sujets proposés',
          labels: { singular: 'Sujet', plural: 'Sujets' },
          admin: { description: 'Liste déroulante « Objet » du formulaire.' },
          defaultValue: [
            { value: 'info', label: 'Demande d\'information' },
            { value: 'reservation', label: 'Réservation / Billetterie' },
            { value: 'mecenat', label: 'Mécénat / Partenariat' },
            { value: 'presse', label: 'Presse / Médias' },
            { value: 'programmation', label: 'Programmation / Booking' },
            { value: 'benevolat', label: 'Bénévolat' },
            { value: 'autre', label: 'Autre' },
          ],
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', required: true, label: 'Libellé affiché', admin: { width: '60%' } },
                {
                  name: 'value',
                  type: 'text',
                  required: true,
                  label: 'Code (sans espace)',
                  admin: { width: '40%', description: 'Ex : info, presse. Sert au tri des messages reçus.' },
                },
              ],
            },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'messageLabel', type: 'text', label: 'Champ message — libellé', defaultValue: 'Message', admin: { width: '50%' } },
            { name: 'messagePlaceholder', type: 'text', label: 'Champ message — exemple', defaultValue: 'Votre message...', admin: { width: '50%' } },
          ],
        },
        { name: 'submitLabel', type: 'text', label: 'Bouton d\'envoi', defaultValue: 'Envoyer le message' },
        { name: 'successEyebrow', type: 'text', label: 'Confirmation — sur-titre', defaultValue: 'Bien reçu' },
        {
          name: 'successTitle',
          type: 'text',
          label: 'Confirmation — titre',
          defaultValue: '*Merci.*',
          admin: { ...richTextAdmin('title'), description: 'Sélectionnez un mot puis « I » pour le mettre en italique coloré.' },
        },
        {
          name: 'successText',
          type: 'textarea',
          label: 'Confirmation — texte',
          defaultValue: 'Votre message vient d\'arriver. Nous vous répondrons personnellement, en général sous 48 heures.',
          admin: { ...richTextAdmin('inline') },
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'Référencement',
      fields: [
        { name: 'metaTitle', type: 'text', label: 'Titre de la page (onglet, Google)', defaultValue: 'Contact — La Chambre Symphonique' },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Description (Google, réseaux sociaux)',
          defaultValue: 'Contactez La Chambre Symphonique pour toute demande d\'information, de réservation ou de partenariat.',
        },
      ],
    },
  ],
};
