'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Histogramme « visiteurs par jour » de la vue Statistiques.
 *
 * Une seule série (pas de légende), barres fines à sommet arrondi, grille
 * discrète, infobulle au survol et au clavier. Les libellés de dates arrivent
 * déjà formatés depuis le serveur pour éviter tout écart d'hydratation.
 */

export type ChartPoint = {
  /** « 2026-09-22 » */
  day: string;
  /** « 22 sept. » */
  label: string;
  /** « mardi 22 septembre 2026 » */
  long: string;
  visitors: number;
  views: number;
  isToday?: boolean;
};

type Props = {
  points: ChartPoint[];
  height?: number;
};

const PAD = { top: 14, right: 8, bottom: 28, left: 40 };
const MAX_BAR = 24;
const GAP = 2;
const DEFAULT_WIDTH = 720;

/** Sommet d'axe « propre » (multiple de 1, 2, 5, 10…) avec au plus 4 graduations. */
function niceMax(max: number): { top: number; step: number } {
  if (max <= 0) return { top: 4, step: 1 };
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000, 100000];
  for (const step of steps) {
    if (max / step <= 4) return { top: Math.ceil(max / step) * step, step };
  }
  const step = 10 ** Math.floor(Math.log10(max));
  return { top: Math.ceil(max / step) * step, step };
}

/** Barre à sommet arrondi (4px) et base carrée, ancrée sur l'axe. */
function barPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  const right = x + w;
  const bottom = y + h;
  return `M${x},${bottom} V${y + r} Q${x},${y} ${x + r},${y} H${right - r} Q${right},${y} ${right},${y + r} V${bottom} Z`;
}

/** Séparateur de milliers identique côté serveur et navigateur. */
function formatNumber(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

const pluralize = (n: number, one: string, many: string) => (n > 1 ? many : one);

export function VisitsChart({ points, height = 220 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(280, Math.round(el.getBoundingClientRect().width)));
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const n = points.length;
  if (n === 0) {
    return <p className="lcs-panel__empty">Aucune donnée sur cette période.</p>;
  }

  const plotW = Math.max(1, width - PAD.left - PAD.right);
  const plotH = Math.max(1, height - PAD.top - PAD.bottom);
  const baseline = PAD.top + plotH;
  const maxValue = points.reduce((m, p) => Math.max(m, p.visitors), 0);
  const { top, step } = niceMax(maxValue);
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);

  const band = plotW / n;
  const barW = Math.max(2, Math.min(MAX_BAR, band - GAP));
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const xOf = (i: number) => PAD.left + i * band + (band - barW) / 2;

  // Un libellé de date tous les ~90px, en partant du jour le plus récent.
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / 90))));

  const active = hover !== null ? points[hover] : null;
  const tipX = hover !== null ? xOf(hover) + barW / 2 : 0;
  const tipAlign = hover === null ? 'center' : tipX < 130 ? 'left' : tipX > width - 130 ? 'right' : 'center';

  return (
    <div className="lcs-chart" ref={wrapRef}>
      <svg
        className="lcs-chart__svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Visiteurs par jour sur les ${n} derniers jours`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              className={t === 0 ? 'lcs-chart__axis' : 'lcs-chart__grid'}
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(t)}
              y2={y(t)}
            />
            <text className="lcs-chart__tick" x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">
              {formatNumber(t)}
            </text>
          </g>
        ))}

        {points.map((p, i) => {
          const h = p.visitors > 0 ? Math.max(2, baseline - y(p.visitors)) : 0;
          const showLabel = (n - 1 - i) % labelEvery === 0;
          const cls = ['lcs-chart__bar', p.isToday ? 'is-today' : '', hover === i ? 'is-hover' : '']
            .filter(Boolean)
            .join(' ');
          return (
            <g key={p.day}>
              {h > 0 && <path className={cls} d={barPath(xOf(i), baseline - h, barW, h)} />}
              {showLabel && (
                <text className="lcs-chart__label" x={xOf(i) + barW / 2} y={height - 8} textAnchor="middle">
                  {p.label}
                </text>
              )}
              {/* Zone de survol plus large que la barre : toute la colonne. */}
              <rect
                className="lcs-chart__hit"
                x={PAD.left + i * band}
                y={PAD.top}
                width={band}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${p.long} : ${formatNumber(p.visitors)} ${pluralize(p.visitors, 'visiteur', 'visiteurs')}, ${formatNumber(p.views)} ${pluralize(p.views, 'page vue', 'pages vues')}`}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              />
            </g>
          );
        })}
      </svg>

      {active && (
        <div
          className={`lcs-chart__tooltip is-${tipAlign}`}
          style={{ left: tipX, top: y(active.visitors) }}
          aria-hidden="true"
        >
          <div className="lcs-chart__tooltip-date">
            {active.long}
            {active.isToday ? ' · en cours' : ''}
          </div>
          <div className="lcs-chart__tooltip-row">
            <strong>{formatNumber(active.visitors)}</strong> {pluralize(active.visitors, 'visiteur', 'visiteurs')}
          </div>
          <div className="lcs-chart__tooltip-row">
            <strong>{formatNumber(active.views)}</strong> {pluralize(active.views, 'page vue', 'pages vues')}
          </div>
        </div>
      )}
    </div>
  );
}

export default VisitsChart;
