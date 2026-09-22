'use client';

import { useMemo, useState } from 'react';
import { renderEmphasis } from '@/lib/emphasis';

type IconKey = 'score' | 'meal' | 'rehearsal' | 'transport' | 'piano' | 'soloist' | 'venue' | 'recording' | 'tour';

type Impact = {
  threshold: number;
  title: string;
  description: string;
  icon: IconKey;
};

/**
 * All copy, rates, presets and impact tiers are editable in the admin
 * (Pages → Page Nous soutenir → Simulateur de don). The constants below are
 * the defaults used until the fields are filled in.
 */
type SimulatorConfig = {
  eyebrow: string;
  title: string;
  lede: string;
  individualLabel: string;
  corporateLabel: string;
  individualRate: number;
  corporateRate: number;
  individualLimit: string;
  corporateLimit: string;
  amountLabel: string;
  realCostLabel: string;
  savingLabel: string;
  impactIntro: string;
  ctaText: string;
  ctaLink: string;
  presets: number[];
  impacts: Impact[];
};

const DEFAULT_IMPACTS: Impact[] = [
  {
    threshold: 30,
    icon: 'score',
    title: 'Une partition imprimée',
    description: "L'édition d'un cahier de musique pour un pupitre de l'orchestre.",
  },
  {
    threshold: 100,
    icon: 'transport',
    title: 'Le déplacement d’un musicien',
    description: 'Le trajet aller-retour d’un instrumentiste pour un concert en région.',
  },
  {
    threshold: 300,
    icon: 'rehearsal',
    title: 'Une heure de salle acoustique',
    description: "Une heure de location d'une salle de répétition adaptée à l'orchestre.",
  },
  {
    threshold: 800,
    icon: 'meal',
    title: 'Le repas de l’orchestre',
    description: 'Le déjeuner de l’ensemble des musiciens lors d’une journée de répétition.',
  },
  {
    threshold: 1500,
    icon: 'piano',
    title: 'Une journée de répétition',
    description: "La location complète d'une salle pour une journée de travail collectif (matinée + après-midi).",
  },
  {
    threshold: 3000,
    icon: 'soloist',
    title: 'Un soliste invité',
    description: "Le cachet d'un soliste de renom pour un concert ou une masterclass.",
  },
  {
    threshold: 6000,
    icon: 'venue',
    title: 'Une salle de concert',
    description: "La location d'une grande salle pour une représentation publique en région.",
  },
  {
    threshold: 12000,
    icon: 'recording',
    title: 'Un enregistrement studio',
    description: "L'enregistrement professionnel d'une œuvre majeure du répertoire.",
  },
  {
    threshold: 25000,
    icon: 'tour',
    title: 'Une tournée régionale',
    description: 'Un week-end de tournée pour l’ensemble de l’orchestre — logistique, transports, hébergement.',
  },
];

const DEFAULT_PRESETS = [50, 150, 500, 1500, 3000, 6000];

const DEFAULTS: SimulatorConfig = {
  eyebrow: 'Simulateur de don',
  title: 'Que *permet* votre don ?',
  lede: 'Choisissez un montant et découvrez son impact concret pour l\'orchestre, ainsi que son coût réel après déduction fiscale.',
  individualLabel: 'Particulier',
  corporateLabel: 'Entreprise',
  individualRate: 66,
  corporateRate: 60,
  individualLimit: '20 % du revenu imposable',
  corporateLimit: '5 ‰ du chiffre d\'affaires',
  amountLabel: 'Votre don',
  realCostLabel: 'Coût réel pour vous',
  savingLabel: 'Économie d\'impôt',
  impactIntro: 'Avec {montant}, vous offrez à l\'orchestre',
  ctaText: 'Faire ce don de {montant}',
  ctaLink: 'https://www.helloasso.com/associations/la-chambre-symphonique',
  presets: DEFAULT_PRESETS,
  impacts: DEFAULT_IMPACTS,
};

const ICON_KEYS: IconKey[] = ['score', 'meal', 'rehearsal', 'transport', 'piano', 'soloist', 'venue', 'recording', 'tour'];

const str = (v: unknown, d: string) => (typeof v === 'string' && v.trim() ? v : d);
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

function resolveConfig(raw: any): SimulatorConfig {
  const g = raw && typeof raw === 'object' ? raw : {};
  const presets = Array.isArray(g.presets)
    ? g.presets.map((p: any) => num(p?.amount, NaN)).filter((n: number) => Number.isFinite(n) && n > 0)
    : [];
  const impacts: Impact[] = Array.isArray(g.impacts)
    ? g.impacts
        .map((i: any) => ({
          threshold: num(i?.threshold, NaN),
          title: str(i?.title, ''),
          description: str(i?.description, ''),
          icon: (ICON_KEYS.includes(i?.icon) ? i.icon : 'score') as IconKey,
        }))
        .filter((i: Impact) => Number.isFinite(i.threshold) && i.threshold > 0 && i.title)
        .sort((a: Impact, b: Impact) => a.threshold - b.threshold)
    : [];
  return {
    eyebrow: str(g.eyebrow, DEFAULTS.eyebrow),
    title: str(g.title, DEFAULTS.title),
    lede: str(g.lede, DEFAULTS.lede),
    individualLabel: str(g.individualLabel, DEFAULTS.individualLabel),
    corporateLabel: str(g.corporateLabel, DEFAULTS.corporateLabel),
    individualRate: num(g.individualRate, DEFAULTS.individualRate),
    corporateRate: num(g.corporateRate, DEFAULTS.corporateRate),
    individualLimit: str(g.individualLimit, DEFAULTS.individualLimit),
    corporateLimit: str(g.corporateLimit, DEFAULTS.corporateLimit),
    amountLabel: str(g.amountLabel, DEFAULTS.amountLabel),
    realCostLabel: str(g.realCostLabel, DEFAULTS.realCostLabel),
    savingLabel: str(g.savingLabel, DEFAULTS.savingLabel),
    impactIntro: str(g.impactIntro, DEFAULTS.impactIntro),
    ctaText: str(g.ctaText, DEFAULTS.ctaText),
    ctaLink: str(g.ctaLink, DEFAULTS.ctaLink),
    presets: presets.length ? presets : DEFAULTS.presets,
    impacts: impacts.length ? impacts : DEFAULTS.impacts,
  };
}

const ICONS: Record<Impact['icon'], React.ReactNode> = {
  score: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="6" width="28" height="36" rx="2" />
        <line x1="14" y1="14" x2="34" y2="14" />
        <line x1="14" y1="20" x2="34" y2="20" />
        <line x1="14" y1="26" x2="34" y2="26" />
        <line x1="14" y1="32" x2="34" y2="32" />
        <circle cx="18" cy="32" r="2" fill="currentColor" />
        <line x1="20" y1="32" x2="20" y2="22" />
      </g>
    </svg>
  ),
  meal: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 18c-9 0-16 4-16 9v3h32v-3c0-5-7-9-16-9z" />
        <path d="M6 32h36" />
        <path d="M24 14V8M21 11l3-3 3 3" />
      </g>
    </svg>
  ),
  rehearsal: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="10" width="36" height="24" rx="2" />
        <path d="M6 30h36" />
        <circle cx="14" cy="22" r="2" fill="currentColor" />
        <circle cx="24" cy="22" r="2" fill="currentColor" />
        <circle cx="34" cy="22" r="2" fill="currentColor" />
        <path d="M16 38l-3 4M32 38l3 4" />
      </g>
    </svg>
  ),
  transport: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 30V18a2 2 0 012-2h28l6 6v8a2 2 0 01-2 2h-3" />
        <path d="M6 30h11M28 30h6" />
        <circle cx="20" cy="32" r="3" fill="currentColor" />
        <circle cx="36" cy="32" r="3" fill="currentColor" />
      </g>
    </svg>
  ),
  piano: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="14" width="36" height="20" rx="2" />
        <path d="M14 14v14M22 14v14M30 14v14M38 14v14" />
        <rect x="11" y="14" width="3" height="8" fill="currentColor" />
        <rect x="19" y="14" width="3" height="8" fill="currentColor" />
        <rect x="27" y="14" width="3" height="8" fill="currentColor" />
        <rect x="35" y="14" width="3" height="8" fill="currentColor" />
      </g>
    </svg>
  ),
  soloist: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="24" cy="14" r="5" />
        <path d="M14 38c0-6 4-10 10-10s10 4 10 10" />
        <path d="M19 38v4M29 38v4" />
        <circle cx="38" cy="22" r="3" fill="currentColor" />
        <path d="M38 19v-7" />
      </g>
    </svg>
  ),
  venue: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 38V20l18-12 18 12v18" />
        <rect x="14" y="22" width="20" height="16" rx="1" />
        <path d="M6 38h36" />
        <line x1="20" y1="28" x2="28" y2="28" />
        <line x1="20" y1="32" x2="28" y2="32" />
      </g>
    </svg>
  ),
  recording: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="18" y="6" width="12" height="22" rx="6" />
        <path d="M10 24a14 14 0 0028 0" />
        <line x1="24" y1="38" x2="24" y2="44" />
        <line x1="18" y1="44" x2="30" y2="44" />
      </g>
    </svg>
  ),
  tour: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="24" cy="24" r="16" />
        <ellipse cx="24" cy="24" rx="7" ry="16" />
        <line x1="8" y1="24" x2="40" y2="24" />
        <line x1="24" y1="8" x2="24" y2="40" />
      </g>
    </svg>
  ),
};

function findImpact(impacts: Impact[], amount: number): Impact {
  let chosen = impacts[0];
  for (const i of impacts) {
    if (amount >= i.threshold) chosen = i;
  }
  return chosen;
}

function findCombination(impacts: Impact[], amount: number): { impact: Impact; quantity: number }[] {
  // Highest single impact you fully cover, plus how many we can offer
  const main = findImpact(impacts, amount);
  const items: { impact: Impact; quantity: number }[] = [];
  if (main) {
    const qty = Math.max(1, Math.floor(amount / main.threshold));
    items.push({ impact: main, quantity: qty });
  }
  // Add a smaller secondary impact if there's leftover
  const leftover = amount - main.threshold * Math.floor(amount / main.threshold);
  if (leftover >= 30) {
    const second = findImpact(impacts, leftover);
    if (second && second.threshold !== main.threshold) {
      items.push({ impact: second, quantity: Math.max(1, Math.floor(leftover / second.threshold)) });
    }
  }
  return items;
}

const formatEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function DonationSimulator({ config }: { config?: any } = {}) {
  const cfg = useMemo(() => resolveConfig(config), [config]);
  const [amount, setAmount] = useState<number>(500);
  const [audience, setAudience] = useState<'individual' | 'corporate'>('individual');

  const ratePct = audience === 'individual' ? cfg.individualRate : cfg.corporateRate;
  const rate = ratePct / 100;
  const realCost = useMemo(() => Math.round(amount * (1 - rate)), [amount, rate]);
  const saving = useMemo(() => Math.round(amount * rate), [amount, rate]);
  const combinations = useMemo(() => findCombination(cfg.impacts, amount), [cfg.impacts, amount]);
  const main = combinations[0]?.impact;
  const withAmount = (template: string) => template.replace('{montant}', formatEur(amount));
  const sliderMax = cfg.impacts[cfg.impacts.length - 2]?.threshold || 12000;

  return (
    <section className="donation-sim" aria-labelledby="donation-sim-title" data-live-field="simulator">
      <div className="donation-sim__head">
        <p className="eyebrow eyebrow--gold eyebrow--centered">{cfg.eyebrow}</p>
        <h2 id="donation-sim-title" className="donation-sim__title">
          {renderEmphasis(cfg.title.replace(/ \?$/, '\u00a0?'))}
        </h2>
        <p className="donation-sim__lede">{cfg.lede}</p>
      </div>

      <div className="donation-sim__panel">
        {/* === Left : controls === */}
        <div className="donation-sim__controls">
          <div className="donation-sim__audience" role="tablist" aria-label="Type de donateur">
            <button
              type="button"
              role="tab"
              aria-selected={audience === 'individual'}
              className={`donation-sim__audience-btn ${audience === 'individual' ? 'is-active' : ''}`}
              onClick={() => setAudience('individual')}
            >
              {cfg.individualLabel}
              <span>−{cfg.individualRate} %</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={audience === 'corporate'}
              className={`donation-sim__audience-btn ${audience === 'corporate' ? 'is-active' : ''}`}
              onClick={() => setAudience('corporate')}
            >
              {cfg.corporateLabel}
              <span>−{cfg.corporateRate} %</span>
            </button>
          </div>

          <label htmlFor="donation-amount" className="donation-sim__amount-label">
            {cfg.amountLabel}
          </label>
          <div className="donation-sim__amount-wrap">
            <input
              id="donation-amount"
              type="number"
              min={10}
              max={50000}
              step={10}
              value={amount}
              onChange={(e) => {
                const v = parseInt(e.target.value || '0', 10);
                setAmount(Math.max(10, Math.min(50000, isNaN(v) ? 0 : v)));
              }}
              className="donation-sim__amount-input"
              inputMode="numeric"
            />
            <span className="donation-sim__amount-suffix">€</span>
          </div>

          <input
            type="range"
            min={30}
            max={sliderMax}
            step={10}
            value={Math.min(amount, sliderMax)}
            onChange={(e) => setAmount(parseInt(e.target.value, 10))}
            className="donation-sim__slider"
            aria-label="Ajuster le montant du don"
          />

          <div className="donation-sim__presets">
            {cfg.presets.map((p) => (
              <button
                key={p}
                type="button"
                className={`donation-sim__preset ${amount === p ? 'is-active' : ''}`}
                onClick={() => setAmount(p)}
              >
                {p} €
              </button>
            ))}
          </div>

          <dl className="donation-sim__costs">
            <div>
              <dt>{cfg.realCostLabel}</dt>
              <dd className="donation-sim__cost">{formatEur(realCost)}</dd>
            </div>
            <div>
              <dt>{cfg.savingLabel}</dt>
              <dd className="donation-sim__saving">−{formatEur(saving)}</dd>
            </div>
          </dl>

          <p className="donation-sim__fineprint">
            Réduction fiscale de {ratePct}&nbsp;% dans la limite de{' '}
            {audience === 'individual' ? cfg.individualLimit : cfg.corporateLimit}.
          </p>
        </div>

        {/* === Right : impact === */}
        <div className="donation-sim__impact">
          <p className="eyebrow">{withAmount(cfg.impactIntro)}</p>

          {main ? (
            <div className="donation-sim__impact-main" key={main.threshold}>
              <span className="donation-sim__icon" aria-hidden>
                {ICONS[main.icon]}
              </span>
              <div>
                <h3>
                  {combinations[0].quantity > 1 && (
                    <span className="donation-sim__qty">{combinations[0].quantity}×</span>
                  )}
                  {main.title}
                </h3>
                <p>{main.description}</p>
              </div>
            </div>
          ) : (
            <p>Choisissez un montant pour voir son impact.</p>
          )}

          {combinations.length > 1 && (
            <p className="donation-sim__plus">
              <span aria-hidden>+</span> {combinations[1].quantity > 1 ? `${combinations[1].quantity}× ` : ''}
              {combinations[1].impact.title.toLowerCase()}
            </p>
          )}

          <ul className="donation-sim__ladder">
            {cfg.impacts.map((i) => {
              const reached = amount >= i.threshold;
              return (
                <li
                  key={i.threshold}
                  className={`donation-sim__rung ${reached ? 'is-reached' : ''} ${i.threshold === main?.threshold ? 'is-current' : ''}`}
                >
                  <span className="donation-sim__rung-amount">{formatEur(i.threshold)}</span>
                  <span className="donation-sim__rung-label">{i.title}</span>
                </li>
              );
            })}
          </ul>

          <a
            href={cfg.ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="donation-sim__cta"
          >
            {withAmount(cfg.ctaText)} →
          </a>
        </div>
      </div>
    </section>
  );
}
