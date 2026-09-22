import './admin-theme.css';
import Link from 'next/link';
import { getPayloadClient } from '@/lib/payload';
import { startOfKeyIso, todayKey } from '@/lib/concerts';

type Props = {
  searchParams?: Record<string, unknown>;
};

type TabKey = 'upcoming' | 'past' | 'all';

/**
 * Shown above the Concerts list in the admin: quick filters « À venir » /
 * « Passés » / « Tous » with counts, and a reminder of how publication works.
 */
export async function ConcertsListNav({ searchParams }: Props) {
  const startOfToday = startOfKeyIso(todayKey());

  let upcoming = 0;
  let past = 0;
  let drafts = 0;
  let missing = 0;

  try {
    const payload = await getPayloadClient();
    const count = (where: Record<string, unknown>) =>
      payload
        .count({ collection: 'concerts' as any, where: where as any })
        .then((r) => r.totalDocs ?? 0)
        .catch(() => 0);

    [upcoming, past, drafts, missing] = await Promise.all([
      count({ date: { greater_than_equal: startOfToday } }),
      count({ date: { less_than: startOfToday } }),
      count({ status: { equals: 'draft' } }),
      count({ date: { exists: false } }),
    ]);
  } catch {
    // Counts are decorative; never block the list view.
  }

  const base = '/admin/collections/concerts';
  const tabs: Array<{ key: TabKey; label: string; count?: number; href: string; hint?: string }> = [
    {
      key: 'upcoming',
      label: 'À venir',
      count: upcoming,
      href: `${base}?where[and][0][date][greater_than_equal]=${encodeURIComponent(startOfToday)}&sort=date`,
      hint: 'Visibles sur le site',
    },
    {
      key: 'past',
      label: 'Passés',
      count: past,
      href: `${base}?where[and][0][date][less_than]=${encodeURIComponent(startOfToday)}&sort=-date`,
      hint: 'Archive, masqués du site',
    },
    { key: 'all', label: 'Tous', href: base },
  ];

  // Detect the active filter from the raw query string keys/values.
  const raw = JSON.stringify(searchParams ?? {});
  const active: TabKey = raw.includes('greater_than_equal')
    ? 'upcoming'
    : raw.includes('less_than')
      ? 'past'
      : 'all';

  return (
    <nav className="lcs-mtabs lcs-ctabs" aria-label="Filtrer les concerts">
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
                <span className="lcs-mtab__count" aria-label={`${t.count} concert${t.count > 1 ? 's' : ''}`}>
                  {t.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <p className="lcs-mtabs__note">
        Un concert reste sur le site jusqu&rsquo;à sa date puis disparaît automatiquement le lendemain.
        {drafts > 0 && (
          <>
            {' '}
            {drafts} brouillon{drafts > 1 ? 's' : ''} masqué{drafts > 1 ? 's' : ''} du site.
          </>
        )}
      </p>

      {missing > 0 && (
        <p className="lcs-mtabs__note lcs-mtabs__note--warn">
          <Link href={`${base}?where[and][0][date][exists]=false`}>
            {missing} concert{missing > 1 ? 's' : ''} sans date
          </Link>
          {' '}
          — {missing > 1 ? 'ils n\'apparaissent' : 'il n\'apparaît'} pas sur le site tant qu&rsquo;une date n&rsquo;est pas renseignée.
        </p>
      )}
    </nav>
  );
}

export default ConcertsListNav;
