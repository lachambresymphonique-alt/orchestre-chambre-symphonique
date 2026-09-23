import './admin-theme.css';
import Link from 'next/link';
import { headers } from 'next/headers';
import { getPayloadClient } from '@/lib/payload';
import { SubmissionFormLink } from './SubmissionFormLink';

type Props = {
  collectionConfig?: { slug?: string };
};

/** Formulaire public où les musiciens remplissent leur fiche. */
const FORM_PATH = '/musiciens/contribuer';

/** Statuts d'une fiche reçue qui attend encore une décision. */
const PENDING_STATUSES = ['nouveau', 'en-cours'];

/**
 * Adresse complète du formulaire : l'URL publique du site si elle est
 * configurée, sinon celle du site sur lequel l'admin est ouvert.
 */
async function formUrl(): Promise<string> {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');
  if (site && /^https?:\/\//.test(site)) return `${site}${FORM_PATH}`;
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host');
    if (host) {
      const proto =
        h.get('x-forwarded-proto')?.split(',')[0].trim() ||
        (host.startsWith('localhost') ? 'http' : 'https');
      return `${proto}://${host}${FORM_PATH}`;
    }
  } catch {
    /* le composant client complétera avec l'adresse du navigateur */
  }
  return FORM_PATH;
}

export async function MusiciansTabsNav({ collectionConfig }: Props) {
  const activeSlug = collectionConfig?.slug;

  let pending = 0;
  try {
    const payload = await getPayloadClient();
    const result = await payload.count({
      collection: 'musician-submissions' as any,
      where: {
        status: { in: PENDING_STATUSES },
      } as any,
    });
    pending = result.totalDocs ?? 0;
  } catch {
    pending = 0;
  }

  const submissionsHref = `/admin/collections/musician-submissions?${PENDING_STATUSES.map(
    (s, i) => `where[and][0][status][in][${i}]=${s}`,
  ).join('&')}`;

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
    <div className="lcs-mtabs lcs-mtabs--with-link">
      <nav aria-label="Vue des musiciens">
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
      <SubmissionFormLink url={await formUrl()} />
    </div>
  );
}

export default MusiciansTabsNav;
