import './admin-overview.css';
import Link from 'next/link';
import type { CollectionSlug, LabelFunction, PayloadRequest, Where } from 'payload';
import { EntityType, getAccessResults } from 'payload';
import { getNavGroups, getVisibleEntities } from '@payloadcms/ui/shared';
import { concertsUpcomingListUrl, startOfKeyIso, todayKey } from '@/lib/concerts';

/**
 * Widget du tableau de bord : « Contenu du site ».
 *
 * Remplace les cartes de collections par défaut de Payload (un titre et un
 * bouton « + » par collection) par des cartes qui donnent les effectifs :
 * combien de musiciens (et par section), de concerts (à venir / passés),
 * d'articles (publiés / brouillons), de fiches reçues à traiter, etc.
 *
 * Les groupes et l'ordre sont ceux du menu de gauche (`admin.group` des
 * collections) ; les pages « globales » et les réglages n'ont pas d'effectif,
 * on ne les répète pas ici : elles ont déjà leurs raccourcis plus haut.
 * Branché dans `payload.config.ts` (`admin.dashboard`).
 */

type Props = { req: PayloadRequest };

type Breakdown = { label: string; value: number };

type Tile = {
  slug: string;
  title: string;
  href: string;
  createHref: string | null;
  total: number | null;
  unit: string;
  hint: string | null;
  alert: boolean;
  breakdown: Breakdown[] | null;
};

type Group = { label: string; tiles: Tile[] };

/** Collections sans effectif utile sur le tableau de bord. */
const SKIPPED: ReadonlySet<string> = new Set(['users', 'page-views']);

/** Unités quand le libellé de la collection ne se lit pas comme un nombre. */
const UNITS: Record<string, [singular: string, plural: string]> = {
  posts: ['article', 'articles'],
  'timeline-events': ['événement', 'événements'],
  'musician-submissions': ['fiche reçue', 'fiches reçues'],
  media: ['image', 'images'],
};

const stroke = { stroke: 'currentColor', strokeWidth: 1.4, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const LayersIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path {...stroke} d="M12 4l8 4-8 4-8-4 8-4z" />
    <path {...stroke} d="M4 12l8 4 8-4" />
    <path {...stroke} d="M4 16l8 4 8-4" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path {...stroke} strokeWidth={1.8} d="M8 3v10M3 8h10" />
  </svg>
);

const countFormat = new Intl.NumberFormat('fr-FR');

function formatCount(n: number): string {
  return countFormat.format(n);
}

/** « 3 concerts », « 1 brouillon ». */
function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${formatCount(n)} ${n > 1 ? pluralForm : singular}`;
}

function lower(label: string): string {
  return label.charAt(0).toLocaleLowerCase('fr-FR') + label.slice(1);
}

/** Libellé Payload (texte, dictionnaire par langue ou fonction) en texte. */
function text(label: unknown, req: PayloadRequest, fallback: string): string {
  if (!label) return fallback;
  if (typeof label === 'string') return label;
  if (typeof label === 'function') {
    const value = (label as LabelFunction)({ t: req.i18n.t, i18n: req.i18n });
    return typeof value === 'string' && value ? value : fallback;
  }
  if (typeof label === 'object') {
    const dict = label as Record<string, string>;
    return dict[req.i18n.language] || dict.fr || Object.values(dict)[0] || fallback;
  }
  return fallback;
}

/** Nombre de documents, ou `null` si la collection ne répond pas (jamais bloquant). */
async function count(req: PayloadRequest, slug: string, where?: Where): Promise<number | null> {
  try {
    const res = await req.payload.count({ collection: slug as CollectionSlug, where, req, overrideAccess: false });
    return res.totalDocs;
  } catch (error) {
    console.error(`Tableau de bord : effectif indisponible pour « ${slug} »`, error);
    return null;
  }
}

/** La collection expose-t-elle ce champ ? (les requêtes sur un champ absent échouent) */
function hasField(req: PayloadRequest, slug: string, name: string): boolean {
  const fields = req.payload.collections[slug as CollectionSlug]?.config.fields ?? [];
  return fields.some((f) => 'name' in f && f.name === name);
}

/** Effectifs des musiciens par section, dans l'ordre du champ « Section ». */
async function musicianSections(req: PayloadRequest): Promise<Breakdown[] | null> {
  const fields = req.payload.collections.musicians?.config.fields ?? [];
  const section = fields.find((f) => 'name' in f && f.name === 'section' && f.type === 'select');
  if (!section || section.type !== 'select') return null;

  const rows = await Promise.all(
    section.options.map(async (option) => {
      const value = typeof option === 'string' ? option : option.value;
      const label = typeof option === 'string' ? option : text(option.label, req, value);
      return { label, value: (await count(req, 'musicians', { section: { equals: value } })) ?? 0 };
    }),
  );
  return rows;
}

/** Détails propres à une collection : sous-titre, alerte, répartition. */
async function details(
  req: PayloadRequest,
  slug: string,
  total: number | null,
): Promise<Pick<Tile, 'hint' | 'alert' | 'breakdown'> & { href?: string }> {
  const none = { hint: null, alert: false, breakdown: null };
  if (total === null) return none;

  switch (slug) {
    case 'musicians':
      return { ...none, breakdown: await musicianSections(req) };

    case 'concerts': {
      // Un concert reste « à venir » jusqu'à sa dernière représentation
      // (`lastDate`) ; à défaut de ce champ, sa date de tête.
      const dateField = hasField(req, slug, 'lastDate') ? 'lastDate' : 'date';
      const from = startOfKeyIso(todayKey());
      const notDraft: Where[] = hasField(req, slug, 'status') ? [{ status: { not_equals: 'draft' } }] : [];
      const [upcoming, past] = await Promise.all([
        count(req, slug, { and: [{ [dateField]: { greater_than_equal: from } }, ...notDraft] }),
        count(req, slug, { [dateField]: { less_than: from } }),
      ]);
      const parts = [
        `${formatCount(upcoming ?? 0)} à venir`,
        past ? plural(past, 'passé') : null,
      ].filter(Boolean);
      return { ...none, hint: parts.join(' · '), href: concertsUpcomingListUrl() };
    }

    case 'posts':
    case 'pages': {
      if (total === 0) return none;
      const [published, drafts] = await Promise.all([
        count(req, slug, { _status: { equals: 'published' } }),
        count(req, slug, { _status: { equals: 'draft' } }),
      ]);
      const feminine = slug === 'pages';
      const parts = [
        plural(published ?? 0, feminine ? 'publiée' : 'publié'),
        drafts ? plural(drafts, 'brouillon') : null,
      ].filter(Boolean);
      return { ...none, hint: parts.join(' · ') };
    }

    case 'musician-submissions': {
      const fresh = (await count(req, slug, { status: { equals: 'nouveau' } })) ?? 0;
      return {
        ...none,
        hint: fresh ? `${plural(fresh, 'nouvelle fiche', 'nouvelles fiches')} à traiter` : 'Aucune nouvelle fiche',
        alert: fresh > 0,
      };
    }

    case 'contact-submissions': {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const recent = (await count(req, slug, { createdAt: { greater_than_equal: since } })) ?? 0;
      return {
        ...none,
        hint: recent ? `${plural(recent, 'reçu')} cette semaine` : 'Aucun cette semaine',
        alert: recent > 0,
      };
    }

    default:
      return none;
  }
}

async function buildGroups(req: PayloadRequest): Promise<Group[]> {
  const { payload, user } = req;
  const adminRoute = payload.config.routes.admin;
  const permissions = await getAccessResults({ req });
  const visible = getVisibleEntities({ req });
  const navGroups = getNavGroups(permissions, visible, payload.config, req.i18n);

  const groups: Group[] = [];
  for (const group of navGroups) {
    const entities = group.entities.filter(
      (e) => e.type === EntityType.collection && !SKIPPED.has(e.slug),
    );
    if (entities.length === 0) continue;

    const tiles = await Promise.all(
      entities.map(async ({ slug, label }): Promise<Tile> => {
        const config = payload.collections[slug as CollectionSlug]?.config;
        const title = text(label, req, slug);
        const singular = text(config?.labels?.singular, req, title);
        const pluralLabel = text(config?.labels?.plural, req, title);
        const [unitSingular, unitPlural] = UNITS[slug] ?? [lower(singular), lower(pluralLabel)];

        const total = await count(req, slug);
        const extra = await details(req, slug, total);
        const canCreate = Boolean(user && permissions.collections?.[slug]?.create);

        return {
          slug,
          title,
          href: extra.href ?? `${adminRoute}/collections/${slug}`,
          createHref: canCreate ? `${adminRoute}/collections/${slug}/create` : null,
          total,
          unit: total === 1 ? unitSingular : unitPlural,
          hint: extra.hint,
          alert: extra.alert,
          breakdown: extra.breakdown,
        };
      }),
    );
    groups.push({ label: group.label, tiles });
  }
  return groups;
}

export async function ContentOverview({ req }: Props) {
  let groups: Group[] = [];
  try {
    groups = await buildGroups(req);
  } catch (error) {
    console.error('Tableau de bord : contenu du site indisponible', error);
    return null;
  }
  if (groups.length === 0) return null;

  return (
    <section className="lcs-overview" aria-label="Contenu du site">
      <div className="lcs-overview__head">
        <span className="lcs-overview__icon" aria-hidden="true">
          <LayersIcon />
        </span>
        <div>
          <div className="lcs-overview__eyebrow">Contenu du site</div>
          <p className="lcs-overview__sub">
            Les effectifs de chaque rubrique. Cliquez sur une carte pour ouvrir la liste,
            ou sur le <strong>+</strong> pour ajouter une fiche.
          </p>
        </div>
      </div>

      {groups.map((group) => (
        <div className="lcs-overview__group" key={group.label}>
          <h2 className="lcs-overview__group-label">{group.label}</h2>
          <ul className="lcs-overview__grid">
            {group.tiles.map((tile) => (
              <li
                key={tile.slug}
                className={[
                  'lcs-tile',
                  tile.breakdown ? 'lcs-tile--wide' : '',
                  tile.alert ? 'lcs-tile--alert' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="lcs-tile__top">
                  <Link href={tile.href} className="lcs-tile__main" aria-label={`Afficher : ${tile.title}`}>
                    <span className="lcs-tile__title">{tile.title}</span>
                  </Link>
                  {tile.createHref && (
                    <Link
                      href={tile.createHref}
                      className="lcs-tile__add"
                      aria-label={`Créer : ${tile.title}`}
                      title={`Créer : ${tile.title}`}
                    >
                      <PlusIcon />
                    </Link>
                  )}
                </div>

                <div className="lcs-tile__value">
                  {tile.total === null ? '—' : formatCount(tile.total)}{' '}
                  <span className="lcs-tile__unit">{tile.total === null ? 'indisponible' : tile.unit}</span>
                </div>

                {tile.hint && <div className="lcs-tile__hint">{tile.hint}</div>}

                {tile.breakdown && (
                  <dl className="lcs-tile__breakdown" aria-label="Effectifs par section">
                    {tile.breakdown.map((row) => (
                      <div className="lcs-tile__row" key={row.label}>
                        <dt>{row.label}</dt>
                        <dd>{formatCount(row.value)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
