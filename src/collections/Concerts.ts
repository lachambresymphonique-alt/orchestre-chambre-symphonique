import type { CollectionConfig, FieldHook } from 'payload';
import {
  isValidConcertTime,
  normalizeConcertDate,
  normalizeConcertTime,
} from '../lib/concerts';

const trim: FieldHook = ({ value }) => (typeof value === 'string' ? value.trim() : value);

export const Concerts: CollectionConfig = {
  slug: 'concerts',
  labels: { singular: 'Concert', plural: 'Concerts' },
  admin: {
    useAsTitle: 'title',
    group: 'Contenu',
    description:
      'Programmation de l\'orchestre. Un concert reste affiché sur le site jusqu\'à sa date, puis disparaît automatiquement le lendemain. Il reste consultable ici.',
    defaultColumns: ['title', 'date', 'venue', 'status'],
    listSearchableFields: ['title', 'venue', 'program'],
    components: {
      beforeList: ['@/components/admin/ConcertsListNav#ConcertsListNav'],
    },
  },
  defaultSort: '-date',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Titre du concert',
      hooks: { beforeValidate: [trim] },
      admin: {
        description:
          'Ex : « Concerto pour violon — Beethoven ». Un concert par date et par lieu : pour une tournée, créez la première date puis utilisez « Dupliquer » (menu ⋯ en haut à droite).',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
          label: 'Date',
          hooks: { beforeValidate: [({ value }) => normalizeConcertDate(value)] },
          admin: {
            width: '50%',
            components: { Cell: '@/components/admin/ConcertDateCell#ConcertDateCell' },
            date: {
              pickerAppearance: 'dayOnly',
              displayFormat: 'EEEE d MMMM yyyy',
            },
            description:
              'Le concert est mis en avant sur le site jusqu\'à cette date, puis masqué automatiquement.',
          },
        },
        {
          name: 'time',
          type: 'text',
          label: 'Heure',
          hooks: { beforeValidate: [({ value }) => normalizeConcertTime(value)] },
          validate: (value: string | null | undefined) => {
            if (!value) return true;
            return (
              isValidConcertTime(value) ||
              'Indiquez une heure comme « 20h30 » ou « 18h ».'
            );
          },
          admin: {
            width: '50%',
            placeholder: '20h30',
            description: 'Laisser vide si l\'horaire n\'est pas encore connu.',
          },
        },
      ],
    },
    {
      name: 'venue',
      type: 'text',
      required: true,
      label: 'Lieu',
      hooks: { beforeValidate: [trim] },
      admin: { description: 'Salle et ville. Ex : « Basilique Notre-Dame, Beaune »' },
    },
    {
      name: 'program',
      type: 'textarea',
      required: true,
      label: 'Programme',
      hooks: { beforeValidate: [trim] },
      admin: {
        description:
          'Œuvres, compositeurs et solistes invités. Une ligne par œuvre de préférence.',
      },
    },
    {
      name: 'bookingLink',
      type: 'text',
      label: 'Lien de réservation',
      hooks: { beforeValidate: [trim] },
      validate: (value: string | null | undefined) => {
        if (!value) return true;
        try {
          const url = new URL(value);
          if (url.protocol === 'https:' || url.protocol === 'http:') return true;
        } catch {
          /* fallthrough */
        }
        return 'Indiquez une adresse complète commençant par https://';
      },
      admin: {
        placeholder: 'https://www.helloasso.com/…',
        description:
          'URL complète vers la billetterie (HelloAsso, salle…). Affiche le bouton « Réserver ». Laisser vide s\'il n\'y a pas de réservation en ligne.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Photo du concert',
      admin: {
        description:
          'Affiche, photo de répétition ou de la salle. Visible surtout pour le prochain concert, mis en avant en page d\'accueil.',
      },
    },

    // ── Sidebar ──────────────────────────────────────────────────────────
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'published',
      label: 'Statut',
      options: [
        { label: 'Publié', value: 'published' },
        { label: 'Brouillon — masqué du site', value: 'draft' },
        { label: 'Annulé — affiché comme annulé', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Un brouillon n\'apparaît jamais sur le site. Un concert annulé reste visible jusqu\'à sa date, barré, sans bouton de réservation.',
      },
    },

    // ── Champs hérités de l'ancien format (texte libre) ──────────────────
    // Conservés pour ne perdre aucune donnée ; ils ne sont plus affichés ni
    // utilisés. Le script src/scripts/migrate-concert-dates.ts les convertit
    // vers `date` / `time`. À supprimer (config + colonnes) une fois la
    // migration vérifiée.
    { name: 'day', type: 'text', label: 'Jour (ancien format)', admin: { hidden: true } },
    { name: 'monthYear', type: 'text', label: 'Mois et année (ancien format)', admin: { hidden: true } },
    { name: 'order', type: 'number', label: 'Ordre (ancien format)', admin: { hidden: true } },
  ],
};
