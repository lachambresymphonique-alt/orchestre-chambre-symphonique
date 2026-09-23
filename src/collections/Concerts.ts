import type { CollectionBeforeValidateHook, CollectionConfig, FieldHook } from 'payload';
import {
  deriveConcertFields,
  isValidConcertTime,
  normalizeConcertDate,
  normalizeConcertTime,
  parisDateKey,
  sortPerformances,
  validateBookingLink,
} from '../lib/concerts';

const trim: FieldHook = ({ value }) => (typeof value === 'string' ? value.trim() : value);

const normalizeDate: FieldHook = ({ value }) => normalizeConcertDate(value);

const validateTime = (value: string | null | undefined) => {
  if (!value) return true;
  return isValidConcertTime(value) || 'Indiquez une heure comme « 20h30 » ou « 18h ».';
};

/**
 * Les représentations font foi. À chaque enregistrement, elles sont classées
 * par date et les champs de tête (`date`, `lastDate`, `time`, `venue`,
 * `bookingLink`) sont recalculés : ce sont eux que lisent le tri et les
 * filtres de la liste, la page d'accueil et le journal.
 *
 * Une fiche d'avant les représentations (une seule date, dans ces champs de
 * tête) en reçoit une à sa prochaine sauvegarde, construite à partir d'eux ;
 * src/scripts/migrate-concert-performances.ts fait la même chose en lot.
 */
const syncPerformances: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data) return data;
  const migrated = Array.isArray(originalDoc?.performances) && originalDoc.performances.length > 0;
  let rows: Record<string, unknown>[] | undefined = Array.isArray(data.performances)
    ? [...data.performances]
    : undefined;

  if (rows === undefined) {
    // Mise à jour partielle sans ce champ (API, script) : rien à recalculer…
    if (migrated) return data;
    // …sauf pour une fiche jamais migrée, qui prend sa représentation des anciens champs.
    rows = [];
  }

  if (rows.length === 0 && !migrated) {
    const legacy = {
      date: data.date ?? originalDoc?.date ?? null,
      time: data.time ?? originalDoc?.time ?? null,
      venue: data.venue ?? originalDoc?.venue ?? null,
      bookingLink: data.bookingLink ?? originalDoc?.bookingLink ?? null,
    };
    if (parisDateKey(legacy.date)) rows.push(legacy);
  }

  // Les hooks de champ normalisent déjà les dates des lignes, mais leur ordre
  // par rapport à celui-ci n'est pas garanti : on normalise ici aussi (idempotent).
  const sorted = sortPerformances(
    rows.map((row) => ({ ...row, date: normalizeConcertDate(row.date) ?? null })),
  );
  const derived = deriveConcertFields(sorted);
  return {
    ...data,
    performances: sorted,
    ...derived,
    date: normalizeConcertDate(derived.date) ?? null,
    lastDate: normalizeConcertDate(derived.lastDate) ?? null,
  };
};

export const Concerts: CollectionConfig = {
  slug: 'concerts',
  labels: { singular: 'Concert', plural: 'Concerts' },
  admin: {
    useAsTitle: 'title',
    group: 'Contenu',
    description:
      'Programmation de l\'orchestre. Un concert regroupe toutes ses représentations (dates et lieux) sous la même affiche. Il reste affiché sur le site jusqu\'à sa dernière représentation, puis disparaît automatiquement le lendemain. Il reste consultable ici.',
    defaultColumns: ['title', 'performances', 'status'],
    listSearchableFields: ['title', 'venue', 'program'],
    components: {
      beforeList: ['@/components/admin/ConcertsListNav#ConcertsListNav'],
    },
  },
  defaultSort: '-date',
  hooks: {
    beforeValidate: [syncPerformances],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Titre du concert',
      hooks: { beforeValidate: [trim] },
      admin: {
        description:
          'Ex : « Concerto pour violon — Beethoven ». Un seul concert par programme : ses dates et ses lieux se listent dans « Représentations », juste en dessous.',
      },
    },
    {
      name: 'soloists',
      type: 'relationship',
      relationTo: 'soloists',
      hasMany: true,
      label: 'Soliste(s) invité·e(s)',
      admin: {
        description:
          'Optionnel. Choisissez le ou la soliste, ou créez sa fiche avec « + » (portrait, instrument, biographie) : son nom et son portrait s\'affichent sur le concert à la une, avec un lien vers sa page.',
      },
    },

    // ── Représentations ─────────────────────────────────────────────────
    {
      name: 'performances',
      type: 'array',
      label: 'Représentations',
      labels: { singular: 'une représentation', plural: 'représentations' },
      required: true,
      minRows: 1,
      admin: {
        description:
          'Une ligne par date et par lieu : le même programme et la même affiche, donnés plusieurs fois. Chaque ligne a sa propre billetterie. Les lignes sont classées par date à l\'enregistrement.',
        initCollapsed: false,
        components: {
          RowLabel: '@/components/admin/ConcertPerformanceRowLabel#ConcertPerformanceRowLabel',
          Cell: '@/components/admin/ConcertDateCell#ConcertDateCell',
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'date',
              type: 'date',
              required: true,
              label: 'Date',
              hooks: { beforeValidate: [normalizeDate] },
              admin: {
                width: '50%',
                date: {
                  pickerAppearance: 'dayOnly',
                  displayFormat: 'EEEE d MMMM yyyy',
                },
              },
            },
            {
              name: 'time',
              type: 'text',
              label: 'Heure',
              hooks: { beforeValidate: [({ value }) => normalizeConcertTime(value)] },
              validate: validateTime,
              admin: {
                width: '50%',
                placeholder: '20h30',
                description: 'Laisser vide si l\'horaire n\'est pas encore connu.',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'venue',
              type: 'text',
              required: true,
              label: 'Lieu',
              hooks: { beforeValidate: [trim] },
              admin: { width: '60%', description: 'La salle. Ex : « Basilique Notre-Dame »' },
            },
            {
              name: 'city',
              type: 'text',
              label: 'Ville',
              hooks: { beforeValidate: [trim] },
              admin: {
                width: '40%',
                placeholder: 'Beaune',
                description: 'Affichée sous la salle, sur sa propre ligne.',
              },
            },
          ],
        },
        {
          name: 'bookingLink',
          type: 'text',
          label: 'Lien de réservation',
          hooks: { beforeValidate: [trim] },
          validate: validateBookingLink,
          admin: {
            placeholder: 'https://www.helloasso.com/…',
            description:
              'Billetterie de cette date (HelloAsso, salle…). Affiche le bouton « Réserver ». Laisser vide s\'il n\'y a pas de réservation en ligne.',
          },
        },
      ],
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
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Affiche du concert',
      admin: {
        description:
          'Affiche, photo de répétition ou de la salle : la même pour toutes les représentations. Visible surtout pour le prochain concert, mis en avant en page d\'accueil.',
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
          'Un brouillon n\'apparaît jamais sur le site. Un concert annulé reste visible jusqu\'à sa dernière représentation, barré, sans bouton de réservation.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'À la une sur l\'accueil',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Affiché en grand en tête de la section Concerts de l\'accueil : affiche, dates avec billetterie et programme. Sans concert coché, le prochain concert est mis à la une ; si plusieurs sont cochés, le plus proche.',
      },
    },

    // ── Champs dérivés des représentations (voir syncPerformances) ──────
    // `date` et `lastDate` portent le tri et les filtres de la liste et du
    // site ; ils s'affichent en lecture seule. `time`, `venue` et
    // `bookingLink` servent aux lecteurs de l'ancien format (journal, recherche).
    {
      name: 'date',
      type: 'date',
      label: 'Première représentation',
      hooks: { beforeValidate: [normalizeDate] },
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayOnly', displayFormat: 'EEEE d MMMM yyyy' },
        description: 'Calculée à partir des représentations.',
      },
    },
    {
      name: 'lastDate',
      type: 'date',
      label: 'Dernière représentation',
      hooks: { beforeValidate: [normalizeDate] },
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayOnly', displayFormat: 'EEEE d MMMM yyyy' },
        description: 'Le concert reste sur le site jusqu\'à cette date, puis est masqué automatiquement.',
      },
    },
    { name: 'time', type: 'text', label: 'Heure (première représentation)', admin: { hidden: true } },
    { name: 'venue', type: 'text', label: 'Lieux (tous)', admin: { hidden: true } },
    { name: 'bookingLink', type: 'text', label: 'Lien de réservation (première représentation)', admin: { hidden: true } },

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
