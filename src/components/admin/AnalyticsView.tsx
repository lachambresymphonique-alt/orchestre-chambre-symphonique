import './admin-theme.css';
import './admin-analytics.css';
import type { AdminViewServerProps } from 'payload';
import { DefaultTemplate } from '@payloadcms/next/templates';
import { Gutter } from '@payloadcms/ui';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { VisitsChart, type ChartPoint } from './VisitsChart';
import {
  AnalyticsError,
  DEFAULT_PROPERTY_ID,
  PERIODS,
  analyticsHomeUrl,
  deviceLabel,
  formatClock,
  formatCount,
  formatDay,
  formatDuration,
  getAnalyticsStats,
  getConfigStatus,
  pageLabel,
  parsePeriod,
  percentChange,
  plural,
  sourceLabel,
  type AnalyticsStats,
  type ConfigStatus,
} from '@/lib/googleAnalytics';

const VIEW_PATH = '/admin/google-analytics';

/** ID de mesure de la balise posée sur le site public (src/app/(frontend)/layout.tsx). */
const MEASUREMENT_ID = 'G-PEYDBZWKSP';

/**
 * Vue « Google Analytics » (/admin/google-analytics).
 *
 * Affiche la fréquentation mesurée par Google Analytics 4, lue côté serveur via
 * l'API Analytics Data (src/lib/googleAnalytics.ts). Tant que l'accès n'est pas
 * configuré, la vue explique comment le mettre en place. Les vues
 * personnalisées Payload ne sont pas protégées par défaut : on exige une
 * session avant d'afficher quoi que ce soit.
 */
export async function AnalyticsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  const { payload } = req;

  if (!req.user || !permissions?.canAccessAdmin) {
    const { routes, admin } = payload.config;
    redirect(`${routes.admin}${admin.routes.login}?redirect=${encodeURIComponent(VIEW_PATH)}`);
  }

  const period = parsePeriod(searchParams?.periode);
  const status = getConfigStatus();
  const configured = status.propertyId !== null && status.credentials;

  let stats: AnalyticsStats | null = null;
  let error: AnalyticsError | null = null;
  if (configured) {
    try {
      stats = await getAnalyticsStats(period);
    } catch (err) {
      console.error('Google Analytics : lecture impossible', err);
      error =
        err instanceof AnalyticsError
          ? err
          : new AnalyticsError(
              err instanceof Error ? err.message : String(err),
              0,
              'Google Analytics n’a pas répondu. Réessayez dans quelques minutes.',
            );
    }
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
      <Gutter className="lcs-stats lcs-ga">
        <header className="lcs-stats__header lcs-ga__top">
          <div>
            <div className="lcs-stats__eyebrow">Google Analytics</div>
            <h1 className="lcs-stats__title">Fréquentation du site</h1>
            <p className="lcs-stats__lead">
              Visiteurs, pages vues et provenances tels que mesurés par Google Analytics sur le site
              public. Les chiffres du jour sont partiels : Google les consolide sous 24 à 48 h.
            </p>
          </div>
          {status.propertyId && (
            <a
              className="lcs-ga__open"
              href={analyticsHomeUrl(status.propertyId)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ouvrir Google Analytics
              <ExternalIcon />
            </a>
          )}
        </header>

        {configured && (
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
                  >
                    <span className="lcs-mtab__label">{p} derniers jours</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}

        {error && (
          <div className="lcs-stats__error" role="alert">
            <strong>Google Analytics n’a pas pu être interrogé.</strong> {error.hint}
            <details className="lcs-ga__details">
              <summary>Détail technique</summary>
              <pre>{error.message}</pre>
            </details>
          </div>
        )}

        {stats && <StatsBody stats={stats} />}

        {!configured && <SetupGuide status={status} />}
        {error && (error.status === 403 || error.status === 404 || error.status === 401 || error.status === 0) && (
          <SetupGuide status={status} compact />
        )}
      </Gutter>
    </DefaultTemplate>
  );
}

export default AnalyticsView;

// ─── Corps de la page ────────────────────────────────────────────────────────

function StatsBody({ stats }: { stats: AnalyticsStats }) {
  const { period, daily, current, previous, allTime, pages, sources, devices, cities, realtime } = stats;
  const periodLabel = `${period} derniers jours`;
  const previousLabel = `${period} jours précédents`;
  const todayKey = daily[daily.length - 1]?.day;

  const points: ChartPoint[] = daily.map((d) => ({
    day: d.day,
    label: formatDay(d.day),
    long: formatDay(d.day, 'long'),
    visitors: d.users,
    views: d.views,
    isToday: d.day === todayKey,
  }));

  const deviceTotal = devices.reduce((sum, d) => sum + d.value, 0);
  const newShare = current.users > 0 ? Math.round((current.newUsers / current.users) * 100) : null;

  return (
    <>
      {allTime.views === 0 && (
        <div className="lcs-tip">
          <span className="lcs-tip__icon" aria-hidden="true">
            <InfoIcon />
          </span>
          <span>
            <strong>Google Analytics n’a encore rien enregistré.</strong> La connexion fonctionne,
            mais la propriété ne contient aucune donnée : vérifiez que l’ID de propriété correspond
            bien au flux de la balise {MEASUREMENT_ID}, et patientez 24 h après la mise en ligne de
            la balise.
          </span>
        </div>
      )}

      <section className="lcs-kpis" aria-label="Chiffres clés">
        <StatTile
          label={`Visiteurs · ${periodLabel}`}
          value={current.users}
          delta={percentChange(current.users, previous.users)}
          deltaLabel={`vs ${previousLabel}`}
          hint={newShare !== null ? `${newShare} % de nouveaux visiteurs` : undefined}
        />
        <StatTile
          label={`Pages vues · ${periodLabel}`}
          value={current.views}
          delta={percentChange(current.views, previous.views)}
          deltaLabel={`vs ${previousLabel}`}
        />
        <StatTile
          label={`Visites · ${periodLabel}`}
          value={current.sessions}
          delta={percentChange(current.sessions, previous.sessions)}
          deltaLabel={`vs ${previousLabel}`}
          hint={current.sessions > 0 ? `${formatDuration(current.avgSessionSeconds)} en moyenne par visite` : undefined}
        />
        <StatTile
          label="En ce moment"
          value={realtime === null ? '—' : realtime}
          live={realtime !== null}
          hint={
            realtime === null
              ? 'Temps réel indisponible'
              : `${realtime > 1 ? 'visiteurs actifs' : 'visiteur actif'} · 30 dernières minutes`
          }
        />
      </section>

      <section className="lcs-panel" aria-labelledby="lcs-ga-chart-title">
        <div className="lcs-panel__head">
          <h2 className="lcs-panel__title" id="lcs-ga-chart-title">
            Visiteurs par jour
          </h2>
          <span className="lcs-panel__meta">{periodLabel} · source Google Analytics</span>
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
                  Visites
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
                  <td className="is-num">{formatCount(d.users)}</td>
                  <td className="is-num">{formatCount(d.sessions)}</td>
                  <td className="is-num">{formatCount(d.views)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <div className="lcs-ga__grid">
        <section className="lcs-panel" aria-labelledby="lcs-ga-pages-title">
          <div className="lcs-panel__head">
            <h2 className="lcs-panel__title" id="lcs-ga-pages-title">
              Pages les plus vues
            </h2>
            <span className="lcs-panel__meta">pages vues · {periodLabel}</span>
          </div>
          <RankList
            empty="Aucune page vue sur cette période."
            rows={pages.map((p) => {
              const label = pageLabel(p.key);
              return {
                key: p.key,
                label,
                sub: label !== p.key ? p.key : undefined,
                value: p.value,
                extra: p.extra !== undefined ? plural(p.extra, 'visiteur') : undefined,
              };
            })}
          />
        </section>

        <section className="lcs-panel" aria-labelledby="lcs-ga-sources-title">
          <div className="lcs-panel__head">
            <h2 className="lcs-panel__title" id="lcs-ga-sources-title">
              Provenance des visites
            </h2>
            <span className="lcs-panel__meta">visites · {periodLabel}</span>
          </div>
          <RankList
            empty="Aucune visite sur cette période."
            rows={sources.map((s) => {
              const label = sourceLabel(s.key);
              return {
                key: s.key || 'inconnu',
                label,
                sub: s.key && label !== s.key && !s.key.startsWith('(') ? s.key : undefined,
                value: s.value,
              };
            })}
          />
          <p className="lcs-panel__note">
            « Accès direct » regroupe les adresses tapées, les favoris et les liens dont la provenance
            n’est pas transmise (courriels, certaines applications).
          </p>
        </section>

        <section className="lcs-panel" aria-labelledby="lcs-ga-devices-title">
          <div className="lcs-panel__head">
            <h2 className="lcs-panel__title" id="lcs-ga-devices-title">
              Appareils
            </h2>
            <span className="lcs-panel__meta">visiteurs · {periodLabel}</span>
          </div>
          <RankList
            empty="Aucun visiteur sur cette période."
            rows={devices.map((d) => ({
              key: d.key,
              label: deviceLabel(d.key),
              value: d.value,
              extra: deviceTotal > 0 ? `${Math.round((d.value / deviceTotal) * 100)} %` : undefined,
            }))}
          />
        </section>

        <section className="lcs-panel" aria-labelledby="lcs-ga-cities-title">
          <div className="lcs-panel__head">
            <h2 className="lcs-panel__title" id="lcs-ga-cities-title">
              Villes
            </h2>
            <span className="lcs-panel__meta">visiteurs · {periodLabel}</span>
          </div>
          <RankList
            empty="Aucune ville identifiée sur cette période."
            rows={cities.map((c) => ({
              key: `${c.key}|${c.sub ?? ''}`,
              label: c.key,
              sub: c.sub,
              value: c.value,
            }))}
          />
          <p className="lcs-panel__note">
            Localisation approximative déduite par Google à partir de la connexion ; une partie des
            visiteurs n’est pas localisable.
          </p>
        </section>
      </div>

      <p className="lcs-stats__method">
        Source : Google Analytics 4, propriété {stats.propertyId} (balise {MEASUREMENT_ID}).
        {allTime.since
          ? ` Depuis le ${formatDay(allTime.since, 'long')} : ${plural(allTime.users, 'visiteur')} et ${plural(allTime.views, 'page vue', 'pages vues')}.`
          : ''}{' '}
        Un visiteur est compté une fois sur la période affichée. Les personnes qui bloquent les scripts
        de mesure ou refusent les cookies ne sont pas comptées. Chiffres rafraîchis toutes les dix
        minutes (relevé à {formatClock(stats.fetchedAt)}).
      </p>
    </>
  );
}

// ─── Guide de configuration ──────────────────────────────────────────────────

function SetupGuide({ status, compact = false }: { status: ConfigStatus; compact?: boolean }) {
  return (
    <section className="lcs-panel lcs-ga-setup" aria-labelledby="lcs-ga-setup-title">
      <div className="lcs-panel__head">
        <h2 className="lcs-panel__title" id="lcs-ga-setup-title">
          {compact ? 'Vérifier la connexion à Google Analytics' : 'Connecter Google Analytics'}
        </h2>
        <span className="lcs-panel__meta">à faire une seule fois · quatre étapes</span>
      </div>

      {!compact && (
        <p className="lcs-ga-setup__intro">
          La balise Google Analytics (<strong>{MEASUREMENT_ID}</strong>) est déjà posée sur le site
          public : Google enregistre les visites. Pour afficher ces chiffres ici, le site doit
          pouvoir interroger Google en votre nom, grâce à un <strong>compte de service</strong> en
          lecture seule. Voici comment le créer. L’ID de la propriété (
          <strong>{status.propertyId ?? DEFAULT_PROPERTY_ID}</strong>) est déjà inscrit dans le code :
          il n’y a rien à relever de ce côté.
        </p>
      )}

      <ol className="lcs-ga-steps">
        <li>
          <strong>Activer l’API.</strong> Dans la{' '}
          <a href="https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com" target="_blank" rel="noopener noreferrer">
            console Google Cloud
          </a>
          , créez ou choisissez un projet, puis activez <em>Google Analytics Data API</em>.
        </li>
        <li>
          <strong>Créer un compte de service.</strong> <em>API et services → Identifiants → Créer des
          identifiants → Compte de service</em>. Ouvrez-le ensuite, onglet <em>Clés → Ajouter une clé →
          Créer une clé → JSON</em> : un fichier <code>.json</code> se télécharge. Conservez-le en lieu
          sûr, il donne accès en lecture aux statistiques.
        </li>
        <li>
          <strong>Autoriser ce compte dans Google Analytics.</strong> Dans{' '}
          <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">
            Google Analytics
          </a>
          , <em>Administration → Gestion des accès à la propriété → +</em> : ajoutez l’adresse e-mail
          du compte de service (elle se termine par <code>.iam.gserviceaccount.com</code>) avec le
          rôle <em>Lecteur</em>.
        </li>
        <li>
          <strong>Renseigner la clé sur Vercel.</strong> Projet <em>site</em> → <em>Settings →
          Environment Variables</em> (Production) : créez <code>GA_SERVICE_ACCOUNT_KEY</code> et
          collez-y le contenu complet du fichier JSON. Puis redéployez le site : cette page affichera
          les chiffres.
        </li>
      </ol>
      <p className="lcs-panel__note">
        Si la propriété Google Analytics change un jour, définissez <code>GA_PROPERTY_ID</code> sur
        Vercel (« ID de propriété », neuf chiffres, dans <em>Administration → Détails de la
        propriété</em>) : cette valeur remplace celle inscrite dans le code. Ce n’est ni l’ID de mesure{' '}
        <code>{MEASUREMENT_ID}</code> de la balise, ni l’ID de flux à onze chiffres.
      </p>

      <div className="lcs-ga-status" aria-label="État de la configuration">
        <span>État actuel :</span>
        <StatusChip
          ok={status.propertyId !== null}
          label="ID de propriété"
          detail={
            status.propertyId
              ? `${status.propertyId} · ${status.propertySource === 'env' ? 'variable GA_PROPERTY_ID' : 'inscrit dans le code'}`
              : 'GA_PROPERTY_ID invalide'
          }
        />
        <StatusChip
          ok={status.credentials}
          label="Clé du compte de service"
          detail={status.credentials ? 'renseignée' : 'GA_SERVICE_ACCOUNT_KEY manquante'}
        />
        {status.problem && <span className="lcs-ga-status__problem">{status.problem}</span>}
      </div>
    </section>
  );
}

function StatusChip({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <span className={`lcs-ga-chip ${ok ? 'is-ok' : 'is-missing'}`}>
      {ok ? <CheckIcon /> : <CrossIcon />}
      <strong>{label}</strong>
      <span>{detail}</span>
    </span>
  );
}

// ─── Éléments ────────────────────────────────────────────────────────────────

type StatTileProps = {
  label: string;
  value: number | string;
  /** undefined : pas de comparaison affichée ; null : période précédente vide. */
  delta?: number | null;
  deltaLabel?: string;
  hint?: string;
  live?: boolean;
};

function StatTile({ label, value, delta, deltaLabel, hint, live }: StatTileProps) {
  return (
    <div className="lcs-kpi">
      <div className="lcs-kpi__label">
        {live && <span className="lcs-live" aria-hidden="true" />}
        {label}
      </div>
      <div className="lcs-kpi__value">{typeof value === 'number' ? formatCount(value) : value}</div>
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

function ExternalIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path {...stroke} d="M6 3H3v10h10v-3" />
      <path {...stroke} d="M9 3h4v4" />
      <path {...stroke} d="M13 3L7 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path {...stroke} d="M3 8.5l3 3 7-7" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path {...stroke} d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
