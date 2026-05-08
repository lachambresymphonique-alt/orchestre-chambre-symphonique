import './admin-theme.css';
import Link from 'next/link';
import { getPayloadClient } from '@/lib/payload';

type Props = {
  collectionConfig?: { slug?: string };
};

export async function MusiciansTabsNav({ collectionConfig }: Props) {
  const activeSlug = collectionConfig?.slug;

  let pending = 0;
  try {
    const payload = await getPayloadClient();
    const result = await payload.count({
      collection: 'musician-submissions' as any,
      where: {
        status: { not_equals: 'traite' },
      } as any,
    });
    pending = result.totalDocs ?? 0;
  } catch {
    pending = 0;
  }

  const submissionsHref =
    '/admin/collections/musician-submissions?where[and][0][status][not_equals]=traite';

  const tabs = [
    {
      slug: 'musicians',
      label: 'Membres validés',
      href: '/admin/collections/musicians',
      hint: 'Publiés sur le site',
      count: undefined as number | undefined,
    },
    {
      slug: 'musician-submissions',
      label: 'Fiches en attente',
      href: submissionsHref,
      hint:
        pending > 0
          ? `${pending} fiche${pending > 1 ? 's' : ''} à relire`
          : 'Aucune en attente',
      count: pending,
    },
  ];

  return (
    <nav className="lcs-mtabs" aria-label="Vue des musiciens">
      <div className="lcs-mtabs__row" role="tablist">
        {tabs.map((t) => {
          const active = activeSlug === t.slug;
          return (
            <Link
              key={t.slug}
              href={t.href}
              role="tab"
              className={`lcs-mtab${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              aria-selected={active}
            >
              <span className="lcs-mtab__label">{t.label}</span>
              {typeof t.count === 'number' && t.count > 0 && (
                <span className="lcs-mtab__badge" aria-label={`${t.count} en attente`}>
                  {t.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MusiciansTabsNav;
