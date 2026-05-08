'use client';

import { useMemo, useState } from 'react';

type Impact = {
  threshold: number;
  title: string;
  description: string;
  icon: 'score' | 'meal' | 'rehearsal' | 'transport' | 'piano' | 'soloist' | 'venue' | 'recording' | 'tour';
};

const IMPACTS: Impact[] = [
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

const PRESETS = [50, 150, 500, 1500, 3000, 6000];

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

function findImpact(amount: number): Impact {
  let chosen = IMPACTS[0];
  for (const i of IMPACTS) {
    if (amount >= i.threshold) chosen = i;
  }
  return chosen;
}

function findCombination(amount: number): { impact: Impact; quantity: number }[] {
  // Highest single impact you fully cover, plus how many we can offer
  const main = findImpact(amount);
  const items: { impact: Impact; quantity: number }[] = [];
  if (main) {
    const qty = Math.max(1, Math.floor(amount / main.threshold));
    items.push({ impact: main, quantity: qty });
  }
  // Add a smaller secondary impact if there's leftover
  const leftover = amount - main.threshold * Math.floor(amount / main.threshold);
  if (leftover >= 30) {
    const second = findImpact(leftover);
    if (second && second.threshold !== main.threshold) {
      items.push({ impact: second, quantity: Math.max(1, Math.floor(leftover / second.threshold)) });
    }
  }
  return items;
}

const formatEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function DonationSimulator() {
  const [amount, setAmount] = useState<number>(500);
  const [audience, setAudience] = useState<'individual' | 'corporate'>('individual');

  const rate = audience === 'individual' ? 0.66 : 0.6;
  const realCost = useMemo(() => Math.round(amount * (1 - rate)), [amount, rate]);
  const saving = useMemo(() => Math.round(amount * rate), [amount, rate]);
  const combinations = useMemo(() => findCombination(amount), [amount]);
  const main = combinations[0]?.impact;

  return (
    <section className="donation-sim" aria-labelledby="donation-sim-title">
      <div className="donation-sim__head">
        <p className="eyebrow eyebrow--gold eyebrow--centered">Simulateur de don</p>
        <h2 id="donation-sim-title" className="donation-sim__title">
          Que <em>permet</em> votre don&nbsp;?
        </h2>
        <p className="donation-sim__lede">
          Choisissez un montant et découvrez son impact concret pour l'orchestre,
          ainsi que son coût réel après déduction fiscale.
        </p>
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
              Particulier
              <span>−66 %</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={audience === 'corporate'}
              className={`donation-sim__audience-btn ${audience === 'corporate' ? 'is-active' : ''}`}
              onClick={() => setAudience('corporate')}
            >
              Entreprise
              <span>−60 %</span>
            </button>
          </div>

          <label htmlFor="donation-amount" className="donation-sim__amount-label">
            Votre don
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
            max={12000}
            step={10}
            value={Math.min(amount, 12000)}
            onChange={(e) => setAmount(parseInt(e.target.value, 10))}
            className="donation-sim__slider"
            aria-label="Ajuster le montant du don"
          />

          <div className="donation-sim__presets">
            {PRESETS.map((p) => (
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
              <dt>Coût réel pour vous</dt>
              <dd className="donation-sim__cost">{formatEur(realCost)}</dd>
            </div>
            <div>
              <dt>Économie d'impôt</dt>
              <dd className="donation-sim__saving">−{formatEur(saving)}</dd>
            </div>
          </dl>

          <p className="donation-sim__fineprint">
            Réduction fiscale de {audience === 'individual' ? '66 %' : '60 %'} dans la
            limite de {audience === 'individual' ? '20 % du revenu imposable' : '5 ‰ du chiffre d\'affaires'}.
          </p>
        </div>

        {/* === Right : impact === */}
        <div className="donation-sim__impact">
          <p className="eyebrow">Avec {formatEur(amount)}, vous offrez à l'orchestre</p>

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
            {IMPACTS.map((i) => {
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
            href="https://www.helloasso.com"
            target="_blank"
            rel="noopener noreferrer"
            className="donation-sim__cta"
          >
            Faire ce don de {formatEur(amount)} →
          </a>
        </div>
      </div>
    </section>
  );
}
