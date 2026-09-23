import './admin-theme.css';
import Link from 'next/link';
import { getPayloadClient } from '@/lib/payload';
import { POST_CATEGORIES } from '@/lib/postCategories';

type Props = {
  searchParams?: Record<string, unknown>;
};

/**
 * Au-dessus de la liste des articles dans l’admin : filtres rapides par
 * rubrique + brouillons, avec les compteurs, et un rappel des règles de
 * publication.
 */
export async function PostsListNav({ searchParams }: Props) {
  const counts: Record<string, number> = {};
  let drafts = 0;
  let scheduled = 0;

  try {
    const payload = await getPayloadClient();
    const count = (where: Record<string, unknown>) =>
      payload
        .count({ collection: 'posts' as any, where: where as any })
        .then((r) => r.totalDocs ?? 0)
        .catch(() => 0);

    const now = new Date().toISOString();
    const [d, s, ...perCategory] = await Promise.all([
      count({ _status: { equals: 'draft' } }),
      count({ and: [{ _status: { equals: 'published' } }, { publishedAt: { greater_than: now } }] }),
      ...POST_CATEGORIES.map((c) => count({ category: { equals: c.value } })),
    ]);
    drafts = d;
    scheduled = s;
    POST_CATEGORIES.forEach((c, i) => {
      counts[c.value] = perCategory[i] ?? 0;
    });
  } catch {
    // Les compteurs sont décoratifs ; ne jamais bloquer la liste.
  }

  const base = '/admin/collections/posts';
  const raw = JSON.stringify(searchParams ?? {});
  const activeCategory = POST_CATEGORIES.find((c) => raw.includes(`"${c.value}"`))?.value;
  const active: string = activeCategory ?? (raw.includes('"draft"') ? 'drafts' : 'all');

  const tabs = [
    { key: 'all', label: 'Tous', href: base, count: undefined as number | undefined, hint: undefined as string | undefined },
    ...POST_CATEGORIES.map((c) => ({
      key: c.value,
      label: c.plural,
      href: `${base}?where[and][0][category][equals]=${c.value}`,
      count: counts[c.value],
      hint: c.hint,
    })),
    {
      key: 'drafts',
      label: 'Brouillons',
      href: `${base}?where[and][0][_status][equals]=draft`,
      count: drafts,
      hint: 'Invisibles sur le site',
    },
  ];

  return (
    <nav className="lcs-mtabs lcs-ctabs" aria-label="Filtrer les articles">
      <div className="lcs-mtabs__row" role="tablist">
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <Link
              key={t.key}
              href={t.href}
              role="tab"
              className={`lcs-mtab${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              aria-selected={isActive}
              title={t.hint}
            >
              <span className="lcs-mtab__label">{t.label}</span>
              {typeof t.count === 'number' && (
                <span className="lcs-mtab__count" aria-label={`${t.count} article${t.count > 1 ? 's' : ''}`}>
                  {t.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <p className="lcs-mtabs__note">
        Un article apparaît sur le site une fois <strong>publié</strong>, à partir de sa date de
        publication. Un brouillon reste invisible mais se prévisualise avec « Aperçu en direct ».
        {scheduled > 0 && (
          <>
            {' '}
            {scheduled} article{scheduled > 1 ? 's' : ''} programmé{scheduled > 1 ? 's' : ''} à une
            date future.
          </>
        )}
      </p>
    </nav>
  );
}

export default PostsListNav;
