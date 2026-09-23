import type { CollectionAfterChangeHook, CollectionAfterReadHook, CollectionConfig } from 'payload';

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/**
 * « Concerts » d'une fiche soliste : un champ virtuel, sans colonne. La seule
 * source est le champ « Soliste(s) invité·e(s) » des concerts (celui que lit le
 * site). À la lecture, on liste les concerts qui citent la fiche ; à
 * l'enregistrement, on ajoute ou retire la fiche de ces concerts.
 */
const idsOf = (value: unknown): Array<string | number> =>
  (Array.isArray(value) ? value : [])
    .map((v) => (v && typeof v === 'object' ? ((v as { id?: unknown; value?: unknown }).value ?? (v as { id?: unknown }).id) : v))
    .filter((v): v is string | number => v !== null && v !== undefined && v !== '');

const readConcerts: CollectionAfterReadHook = async ({ doc, req }) => {
  if (!doc?.id) return doc;
  try {
    const res = await req.payload.find({
      collection: 'concerts' as any,
      where: { soloists: { in: [doc.id] } } as any,
      depth: 0,
      limit: 200,
      pagination: false,
      sort: '-date',
      select: { id: true } as any,
      req,
    });
    return { ...doc, concerts: res.docs.map((c: any) => c.id) };
  } catch {
    return doc;
  }
};

const writeConcerts: CollectionAfterChangeHook = async ({ doc, data, req, context }) => {
  // Champ absent de l'envoi (API, script, mise à jour partielle) : rien à synchroniser.
  if (context?.skipSoloistSync || !data || !('concerts' in data)) return doc;
  const wanted = new Set(idsOf((data as any).concerts).map(String));

  const current = await req.payload.find({
    collection: 'concerts' as any,
    where: { soloists: { in: [doc.id] } } as any,
    depth: 0,
    limit: 200,
    pagination: false,
    req,
  });
  const had = new Set(current.docs.map((c: any) => String(c.id)));

  const update = async (concertId: string, next: (ids: Array<string | number>) => Array<string | number>) => {
    const concert: any = await req.payload.findByID({ collection: 'concerts' as any, id: concertId, depth: 0, req });
    await req.payload.update({
      collection: 'concerts' as any,
      id: concertId,
      data: { soloists: next(idsOf(concert?.soloists)) } as any,
      depth: 0,
      req,
      context: { skipSoloistSync: true },
    });
  };

  for (const id of wanted) {
    if (!had.has(id)) await update(id, (ids) => [...ids, doc.id]);
  }
  for (const id of had) {
    if (!wanted.has(id)) await update(id, (ids) => ids.filter((x) => String(x) !== String(doc.id)));
  }
  return doc;
};

export const Soloists: CollectionConfig = {
  slug: 'soloists',
  labels: { singular: 'Soliste', plural: 'Solistes' },
  admin: {
    useAsTitle: 'name',
    group: 'Contenu',
    description:
      'Solistes invités — passés ou à venir. Chaque fiche a sa page sur le site (/solistes/…). Rattachez un·e soliste à ses concerts ici (« Concerts ») ou depuis la fiche du concert (« Soliste(s) invité·e(s) ») : c’est le même lien ; il ou elle apparaît alors sur le concert à la une. Mise en avant sur l\'accueil : Page d\'accueil › À la une.',
    defaultColumns: ['photo', 'name', 'instrument', 'order'],
  },
  defaultSort: 'order',
  hooks: {
    afterRead: [readConcerts],
    afterChange: [writeConcerts],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nom complet' },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug (URL)',
      admin: {
        position: 'sidebar',
        description: 'Auto-généré à partir du nom si laissé vide.',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (value) return value;
            const name = (data as any)?.name;
            return name ? slugify(name) : value;
          },
        ],
      },
    },
    {
      name: 'instrument',
      type: 'text',
      required: true,
      label: 'Instrument / discipline',
      admin: { description: 'Ex : « Violoncelle », « Soprano », « Piano »' },
    },
    {
      name: 'role',
      type: 'text',
      label: 'Précision',
      admin: {
        description:
          'Optionnel. Ex : « Premier prix CNSMD », « Soliste invité 2025 ».',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Portrait',
      admin: {
        description: 'Photo en portrait (3:4 ou 4:5 idéal).',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'Biographie courte',
      admin: { description: 'Quelques phrases. Affiché en complément du nom.' },
    },
    {
      name: 'tagline',
      type: 'text',
      label: 'Phrase signature',
      admin: { description: 'Une ligne, optionnelle, pour résumer.' },
    },
    {
      name: 'website',
      type: 'text',
      label: 'Site web',
      admin: { description: 'URL personnelle ou page de l\'agent.' },
    },
    {
      name: 'concert',
      type: 'relationship',
      relationTo: 'concerts' as any,
      label: 'Concert associé (ancien champ)',
      // Remplacé par « Concerts » ci-dessous. Jamais lu par le site ; conservé
      // masqué pour ne pas supprimer sa colonne.
      admin: { hidden: true },
    },
    {
      name: 'concerts',
      type: 'relationship',
      relationTo: 'concerts' as any,
      hasMany: true,
      virtual: true,
      label: 'Concerts',
      admin: {
        // Le choix s'ouvre sur la liste des concerts, avec leurs dates, lieux et
        // état : deux concerts de même titre se distinguent.
        appearance: 'drawer',
        description:
          'Les concerts où le ou la soliste joue (passés ou à venir). Ajouter ou retirer un concert ici met à jour « Soliste(s) invité·e(s) » dans la fiche du concert — c’est le même lien.',
        components: {
          afterInput: ['@/components/admin/ConcertRelationSummary#ConcertRelationSummary'],
        },
      },
    },
    {
      name: 'context',
      type: 'text',
      label: 'Contexte d\'apparition',
      admin: {
        description:
          'Ce qui sera affiché à côté du nom (ex : « Concerto pour violon de Brahms — janvier 2026 »).',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'Ordre d\'affichage',
      admin: {
        position: 'sidebar',
        description: 'Plus petit = affiché en premier.',
      },
    },
  ],
};
