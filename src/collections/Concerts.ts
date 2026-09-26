import type { CollectionBeforeChangeHook, CollectionBeforeValidateHook, CollectionConfig, FieldHook } from 'payload';
import { SLUG_PATTERN, slugify } from '../lib/slug';
import {
  concertSlugBase,
  deriveConcertFields,
  isValidConcertTime,
  normalizeConcertDate,
  normalizeConcertTime,
  parisDateKey,
  sortPerformances,
  validateBookingLink,
} from '../lib/concerts';
import { richTextAdmin } from '@/lib/richTextAdmin';

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

/**
 * Adresse de la page du concert (/concerts/<slug>). Tapée : nettoyée. Vide :
 * tirée du titre et de l'année de la première représentation. Toujours unique :
 * un suffixe (-2, -3…) départage deux concerts de même titre. Une mise à jour
 * qui n'envoie pas ce champ (API, script) garde l'adresse existante.
 */
const concertSlug: FieldHook = async ({ value, data, originalDoc, req }) => {
  if (value === undefined && originalDoc?.slug) return originalDoc.slug;
  const typed = typeof value === 'string' ? value.trim() : '';
  const base =
    (typed && slugify(typed)) ||
    concertSlugBase(data?.title ?? originalDoc?.title, data?.performances ?? originalDoc?.performances);
  if (!base) return value;

  const selfId = originalDoc?.id;
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const taken = await req.payload.find({
      collection: 'concerts' as any,
      where: {
        and: [{ slug: { equals: candidate } }, ...(selfId ? [{ id: { not_equals: selfId } }] : [])],
      } as any,
      limit: 1,
      depth: 0,
      pagination: false,
      req,
    });
    if (taken.docs.length === 0) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
};

/**
 * Quand l'adresse d'un concert change, l'ancienne est gardée dans
 * `slugHistory` : /concerts/<ancienne> redirige (308) vers la nouvelle, et les
 * liens déjà partagés ou indexés continuent de fonctionner. L'adresse courante
 * n'y figure jamais, ce qui exclut toute boucle. (Même principe que le blog.)
 */
const rememberPreviousSlug: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const next = typeof data?.slug === 'string' ? data.slug : undefined;
  const previous = typeof originalDoc?.slug === 'string' ? originalDoc.slug : undefined;
  if (!next) return data;
  const source: unknown[] = Array.isArray(data?.slugHistory)
    ? data.slugHistory
    : Array.isArray(originalDoc?.slugHistory)
      ? originalDoc.slugHistory
      : [];
  const slugs = new Set<string>();
  for (const entry of source) {
    const s = (entry as { slug?: unknown } | null)?.slug;
    if (typeof s === 'string' && s) slugs.add(s);
  }
  if (previous && previous !== next) slugs.add(previous);
  slugs.delete(next);
  data.slugHistory = [...slugs].map((slug) => ({ slug }));
  return data;
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
    beforeChange: [rememberPreviousSlug],
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
      name: 'description',
      type: 'textarea',
      label: 'Présentation',
      hooks: { beforeValidate: [trim] },
      admin: {
        ...richTextAdmin('prose'),
        description:
          'Texte de la page du concert, sous le programme : les œuvres, les interprètes, l’histoire du projet. Quelques paragraphes (une ligne vide les sépare). C’est aussi ce que lit Google.',
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

    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      label: 'Adresse de la page',
      hooks: { beforeValidate: [concertSlug] },
      validate: (value: string | null | undefined) =>
        !value || SLUG_PATTERN.test(value)
          ? true
          : 'Lettres minuscules, chiffres et tirets seulement (ex : schumann-mahler-titan-2026).',
      admin: {
        position: 'sidebar',
        description:
          'Fin de l’adresse de la page : /concerts/schumann-mahler-titan-2026. Remplie toute seule à partir du titre ; raccourcissez-la si besoin : l’ancienne adresse redirigera vers la nouvelle.',
      },
    },
    {
      name: 'slugHistory',
      type: 'array',
      label: 'Anciennes adresses',
      labels: { singular: 'Ancienne adresse', plural: 'Anciennes adresses' },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Remplies automatiquement quand l’adresse change : chacune redirige vers la page du concert.',
        condition: (data) => Array.isArray(data?.slugHistory) && data.slugHistory.length > 0,
      },
      fields: [{ name: 'slug', type: 'text', required: true, index: true, label: 'Adresse' }],
    },
    {
      name: 'meta',
      type: 'group',
      label: 'Référencement (Google)',
      admin: {
        position: 'sidebar',
        description: 'Facultatif : sans ces champs, le titre, les villes et les dates sont utilisés.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Titre pour Google',
          admin: { description: 'Environ 60 caractères. Ex : « Schumann & Mahler, Symphonie Titan — Grenoble, Lyon, Beaune ».' },
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description pour Google',
          admin: { description: 'Environ 150 caractères : ce qui s’affiche sous le titre dans les résultats de recherche.' },
        },
      ],
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
