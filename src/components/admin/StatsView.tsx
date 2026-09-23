import './admin-theme.css';
import type { AdminViewServerProps } from 'payload';
import { DefaultTemplate } from '@payloadcms/next/templates';
import { Gutter } from '@payloadcms/ui';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { VisitsChart, type ChartPoint } from './VisitsChart';
import {
  PERIODS,
  deviceLabel,
  formatCount,
  formatDay,
  getVisitStats,
  pageLabel,
  parsePeriod,
  percentChange,
  plural,
  sourceLabel,
  type VisitStats,
} from '@/lib/stats';

const VIEW_PATH = '/admin/statistiques';

/**
 * Vue « Statistiques de visite » (/admin/statistiques).
 *
 * Vue personnalisée Payload rendue dans le gabarit standard de l'admin (barre
 * latérale, en-tête). Les vues personnalisées ne sont pas protégées par
 * défaut : on exige une session avant d'afficher quoi que ce soit.
 */
export async function StatsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  const { payload } = req;

  if (!req.user || !permissions?.canAccessAdmin) {
    const { routes, admin } = payload.config;
    redirect(`${routes.admin}${admin.routes.login}?redirect=${encodeURIComponent(VIEW_PATH)}`);
  }

  const period = parsePeriod(searchParams?.periode);

  let stats: VisitStats | null = null;
  let error: string | null = null;
  try {
    stats = await getVisitStats(payload, period);
  } catch (err) {
    console.error('Statistiques : lecture impossible', err);
    error =
      'Les statistiques ne peuvent pas être lues pour le moment. Si le site vient d’être mis à jour, la table des visites n’existe peut-être pas encore : réessayez dans quelques minutes.';
  }

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={{
        collections: visibleEntities?.collections ?? [],
        globals: visibleEntities?.globals ?? [],
      }}
    >
      <Gutter className="lcs-stats">
        <header className="lcs-stats__header">
          <div className="lcs-stats__eyebrow">Fréquentation du site</div>
          <h1 className="lcs-stats__title">Statistiques de visite</h1>
          <p className="lcs-stats__lead">
            Qui vient sur le site, quand, par quelles pages et d’où. Comptage interne, sans cookie
            ni donnée personnelle.
          </p>
        </header>

        <nav className="lcs-mtabs lcs-stats__periods" aria-label="Période affichée">
          <div className="lcs-mtabs__row">
            {PERIODS.map((p) => {
              const isActive = p === period;
              return (
                <Link
                  key={p}
                  href={p === 30 ? VIEW_PATH : `${VIEW_PATH}?periode=${p}`}
                  className={`lcs-mtab${isActive ? ' is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`${p} derniers jours`}
                >
                  {/* Libellé court sur petit écran (voir admin-theme.css) */}
                  <span className="lcs-mtab__label" aria-hidden="true">
                    <span className="lcs-stats__period-full">{p} derniers jours</span>
                    <span className="lcs-stats__period-short">{p} jours</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {error && (
          <p className="lcs-stats__error" role="alert">
            {error}
          </p>
        )}
        {stats && <StatsBody stats={stats} />}
      </Gutter>
    </DefaultTemplate>
  );
}

export default StatsView;

// ─── Corps de la page ────────────────────────────────────────────────────────

function StatsBody({ stats }: { stats: VisitStats }) {
  const { period, daily, current, previous, today, allTime, pages, sources, devices } = stats;
  const periodLabel = `${period} derniers jours`;
  const previousLabel = `${period} jours précédents`;
  const todayKey = daily[daily.length - 1]?.day;

  const points: ChartPoint[] = daily.map((d) => ({
    day: d.day,
    label: formatDay(d.day),
    long: formatDay(d.day, 'long'),
    visitors: d.visitors,
    views: d.views,
    isToday: d.day === todayKey,
  }));

  const deviceTotal = devices.reduce((sum, d) => sum + d.visitors, 0);

  return (
    <>
      {allTime.views === 0 && (
        <div className="lcs-tip">
          <span className="lcs-tip__icon" aria-hidden="true">
            <InfoIcon />
          </span>
          <span>
            <strong>Aucune visite enregistrée pour l’instant.</strong> Le compteur démarre dès que
            cette version du site est en ligne. Les visites des administrateurs connectés ne sont
            pas comptées : pour vérifier, ouvrez le site dans une fenêtre de navigation privée.
          </span>
        </div>
      )}

      <section className="lcs-kpis" aria-label="Chiffres clés">
        <StatTile
          label={`Visiteurs · ${periodLabel}`}
          value={current.visitors}
          delta={percentChange(current.visitors, previous.visitors)}
          deltaLabel={`vs ${previousLabel}`}
        />
        <StatTile
          label={`Pages vues · ${periodLabel}`}
          value={current.views}
          delta={percentChange(current.views, previous.views)}
          deltaLabel={`vs ${previousLabel}`}
        />
        <StatTile
          label="Visiteurs aujourd’hui"
          value={today.visitors}
          hint={`${plural(today.views, 'page vue', 'pages vues')} · journée en cours`}
        />
        <StatTile
          label="Visiteurs depuis le début"
          value={allTime.visitors}
          hint={
            allTime.since
              ? `${plural(allTime.views, 'page vue', 'pages vues')} depuis le ${formatDay(allTime.since, 'long')}`
              : 'Aucune donnée pour l’instant'
          }
        />
      </section>

      <section className="lcs-panel" aria-labelledby="lcs-chart-title">
        <div className="lcs-panel__head">
          <h2 className="lcs-panel__title" id="lcs-chart-title">
            Visiteurs par jour
          </h2>
          <span className="lcs-panel__meta">
            {periodLabel} · un visiteur est compté une fois par jour
          </span>
        </div>
        <VisitsChart points={points} />
        <details className="lcs-stats__table">
          <summary>Voir le détail jour par jour</summary>
          <table className="lcs-table">
            <thead>
              <tr>
                <th scope="col">Jour</th>
                <th scope="col" className="is-num">
                  Visiteurs
                </th>
                <th scope="col" className="is-num">
                  Pages vues
                </th>
              </tr>
            </thead>
            <tbody>
              {[...daily].reverse().map((d) => (
                <tr key={d.day}>
                  <td>{formatDay(d.day, 'long')}</td>
                  <td className="is-num">{formatCount(d.visitors)}</td>
                  <td className="is-num">{formatCount(d.views)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <div className="lcs-stats__grid">
        <section className="lcs-panel" aria-labelledby="lcs-pages-title">
          <div className="lcs-panel__head">
            <h2 className="lcs-panel__title" id="lcs-pages-title">
              Pages les plus vues
            </h2>
            <span className="lcs-panel__meta">pages vues · {periodLabel}</span>
          </div>
          <RankList
            empty="Aucune page vue sur cette période."
            rows={pages.map((p) => {
              const label = pageLabel(p.path);
              return {
                key: p.path,
                label,
                sub: label !== p.path ? p.path : undefined,
                value: p.views,
                extra: plural(p.visitors, 'visiteur'),
              };
            })}
          />
        </section>

        <section className="lcs-panel" aria-labelledby="lcs-sources-title">
          <div className="lcs-panel__head">
            <h2 className="lcs-panel__title" id="lcs-sources-title">
              Provenance des visites
            </h2>
            <span className="lcs-panel__meta">arrivées · {periodLabel}</span>
          </div>
          <RankList
            empty="Aucune arrivée sur cette période."
            rows={sources.map((s) => {
              const label = sourceLabel(s.referrer);
              return {
                key: s.referrer || 'direct',
                label,
                sub: s.referrer && label !== s.referrer ? s.referrer : undefined,
                value: s.entries,
              };
            })}
          />
          <p className="lcs-panel__note">
            Une « arrivée » est la première page ouverte lors d’une visite. « Accès direct »
            regroupe les adresses tapées, les favoris et les liens dont la provenance n’est pas
            transmise (courriels, certaines applications).
          </p>
        </section>

        <section className="lcs-panel" aria-labelledby="lcs-devices-title">
          <div className="lcs-panel__head">
            <h2 className="lcs-panel__title" id="lcs-devices-title">
              Appareils
            </h2>
            <span className="lcs-panel__meta">visiteurs · {periodLabel}</span>
          </div>
          <RankList
            empty="Aucun visiteur sur cette période."
            rows={devices.map((d) => ({
              key: d.device,
              label: deviceLabel(d.device),
              value: d.visitors,
              extra: deviceTotal > 0 ? `${Math.round((d.visitors / deviceTotal) * 100)} %` : undefined,
            }))}
          />
        </section>
      </div>

      <p className="lcs-stats__method">
        Méthode : chaque page ouverte sur le site envoie un signal anonyme. Un visiteur est reconnu
        au cours d’une même journée grâce à une empreinte renouvelée chaque jour (aucune adresse IP
        ni cookie n’est conservé), puis compté une fois par jour. Les robots, l’aperçu en direct et
        les administrateurs connectés sont exclus. Ces chiffres peuvent différer de Google
        Analytics, qui dépend du consentement et des bloqueurs de publicité.
      </p>
    </>
  );
}

// ─── Éléments ────────────────────────────────────────────────────────────────

type StatTileProps = {
  label: string;
  value: number;
  /** undefined : pas de comparaison affichée ; null : période précédente vide. */
  delta?: number | null;
  deltaLabel?: string;
  hint?: string;
};

function StatTile({ label, value, delta, deltaLabel, hint }: StatTileProps) {
  return (
    <div className="lcs-kpi">
      <div className="lcs-kpi__label">{label}</div>
      <div className="lcs-kpi__value">{formatCount(value)}</div>
      {delta !== undefined &&
        (delta === null ? (
          <div className="lcs-kpi__delta is-neutral">Pas encore de comparaison</div>
        ) : (
          <div className={`lcs-kpi__delta ${delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : 'is-flat'}`}>
            <DeltaIcon direction={delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'} />
            <span>
              {delta > 0 ? '+' : ''}
              {formatCount(delta)} %
            </span>
            {deltaLabel && <span className="lcs-kpi__delta-ctx">{deltaLabel}</span>}
          </div>
        ))}
      {hint && <div className="lcs-kpi__hint">{hint}</div>}
    </div>
  );
}

type RankRow = { key: string; label: string; sub?: string; value: number; extra?: string };

function RankList({ rows, empty }: { rows: RankRow[]; empty: string }) {
  if (rows.length === 0) return <p className="lcs-panel__empty">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ol className="lcs-rank">
      {rows.map((r) => (
        <li key={r.key} className="lcs-rank__row">
          <div className="lcs-rank__head">
            <span className="lcs-rank__label">
              {r.label}
              {r.sub && <span className="lcs-rank__sub">{r.sub}</span>}
            </span>
            <span className="lcs-rank__value">
              <strong>{formatCount(r.value)}</strong>
              {r.extra && <span className="lcs-rank__extra"> · {r.extra}</span>}
            </span>
          </div>
          <div className="lcs-rank__meter" aria-hidden="true">
            <div className="lcs-rank__fill" style={{ width: `${Math.max(1, (r.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.6,
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function DeltaIcon({ direction }: { direction: 'up' | 'down' | 'flat' }) {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      {direction === 'up' && <path {...stroke} d="M3 11l4-5 3 3 3-4" />}
      {direction === 'down' && <path {...stroke} d="M3 5l4 5 3-3 3 4" />}
      {direction === 'flat' && <path {...stroke} d="M3 8h10" />}
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle {...stroke} cx="12" cy="12" r="9" />
      <path {...stroke} d="M12 11v5" />
      <path {...stroke} d="M12 8h.01" />
    </svg>
  );
}
