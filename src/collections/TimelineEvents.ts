import type { CollectionConfig } from 'payload';
import { generateNKeysBetween } from 'payload/shared';
import { richTextAdmin } from '@/lib/richTextAdmin';

/** Première année écrite (« 2020-2021 » → 2020) ; sans année, en dernier. */
const firstYear = (year: unknown) => {
  const match = String(year ?? '').match(/\d{4}/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
};

export const TimelineEvents: CollectionConfig = {
  slug: 'timeline-events',
  labels: { singular: 'Date', plural: 'Chronologie' },
  // Glisser-déposer dans la liste de l'admin : Payload range l'ordre dans un
  // champ caché `_order`, que la page À propos suit.
  orderable: true,
  admin: {
    useAsTitle: 'year',
    group: 'Contenu',
    description:
      'Les dates qui racontent l’histoire de l’orchestre, affichées sur la page À propos dans l’ordre de cette liste. « Créer » ajoute une date ; pour en retirer une, ouvrez-la et choisissez « Supprimer ».',
    defaultColumns: ['year', 'description'],
    components: {
      beforeListTable: ['@/components/admin/TimelineOrderBar#TimelineOrderBar'],
    },
  },
  defaultSort: '_order',
  endpoints: [
    {
      // « Trier par année » : range toute la chronologie de la plus ancienne
      // à la plus récente ; à égalité, l'ordre actuel est gardé.
      path: '/sort-by-year',
      method: 'post',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Connexion requise.' }, { status: 401 });
        const { docs } = await req.payload.find({
          collection: 'timeline-events',
          depth: 0,
          pagination: false,
          sort: '_order',
          req,
        });
        const sorted = [...docs].sort((a, b) => firstYear(a.year) - firstYear(b.year));
        const keys = generateNKeysBetween(null, null, sorted.length);
        for (const [i, doc] of sorted.entries()) {
          await req.payload.update({
            collection: 'timeline-events',
            id: doc.id,
            data: { _order: keys[i] } as Record<string, unknown>,
            depth: 0,
            req,
          });
        }
        return Response.json({ count: sorted.length });
      },
    },
  ],
  fields: [
    {
      name: 'year',
      type: 'text',
      required: true,
      label: 'Année',
      admin: { description: 'Ex : « 2017 » ou « 2020-2021 »' },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      label: 'Description',
      admin: { ...richTextAdmin('prose'), description: 'Ce qui s’est passé cette année-là.' },
    },
    {
      // Ancien réglage numérique, remplacé par le glisser-déposer (`_order`).
      // Gardé en base, masqué.
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'Ordre d’affichage',
      admin: { hidden: true },
    },
  ],
};
