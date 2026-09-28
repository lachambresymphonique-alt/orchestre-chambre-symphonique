'use client';

import './admin-theme.css';
import './admin-member-invite.css';
import { useEffect, useState, type ReactNode } from 'react';

/**
 * Mode d'emploi de l'espace membres, en tête des listes Accès membres,
 * Demandes d'accès et Liens d'inscription. Écrit pour quelqu'un qui découvre
 * l'outil. Ouverte par défaut tant qu'aucun lien d'inscription n'existe (premiers
 * pas), repliée ensuite. Replier la notice avant ce premier lien est retenu
 * dans ce navigateur.
 */

const STORAGE_KEY = 'lcs-members-guide-closed';

/** Pictogrammes au trait (24 × 24), dans la couleur du texte. */
const ICONS: Record<string, ReactNode> = {
  book: <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />,
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      <circle cx="9" cy="7" r="4" />
    </>
  ),
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  link: <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />,
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  check: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />,
  card: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M15 8h2M15 12h2M7 16h10" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M4.9 4.9l14.2 14.2" />
    </>
  ),
  unlink: <path d="M9 17H7A5 5 0 0 1 7 7M15 7h2a5 5 0 0 1 4 8M8 12h4M2 2l20 20" />,
  refresh: <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />,
  pencil: <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />,
  chevron: <path d="m6 9 6 6 6-6" />,
};

function Icon({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICONS[name]}
    </svg>
  );
}

type Step = { icon: string; text: ReactNode };

const GROUP_STEPS: Step[] = [
  { icon: 'link', text: <><b>Liens d’inscription → Créer</b>, pour les musiciens ou l’équipe technique.</> },
  { icon: 'copy', text: <><b>Copier</b> l’adresse dans la discussion du groupe.</> },
  { icon: 'check', text: <>Chaque demande arrive dans <b>Demandes d’accès</b> : ouvrez-la, <b>Accepter…</b></> },
  { icon: 'send', text: <>Le <b>lien de connexion</b> part par e-mail ; vous pouvez aussi le copier.</> },
];

const PERSON_STEPS: Step[] = [
  { icon: 'card', text: <><b>Musiciens</b> → ouvrez sa fiche.</> },
  { icon: 'mail', text: <><b>Inviter à l’espace membres</b>, en haut à droite.</> },
  { icon: 'send', text: <>Le lien part par e-mail ; vous pouvez aussi le copier.</> },
];

const TIPS: Step[] = [
  { icon: 'music', text: <><b>Partitions</b> : remplissez « Pupitres » sur la fiche.</> },
  { icon: 'ban', text: <><b>Retirer un accès</b> : statut « Désactivé ».</> },
  { icon: 'unlink', text: <><b>Lien trop partagé</b> : décochez « Lien actif ».</> },
  { icon: 'refresh', text: <><b>Lien expiré</b> : renvoyez-en un depuis la fiche.</> },
  { icon: 'pencil', text: <><b>Fiches modifiées</b> : Messages reçus → Modifications proposées.</> },
];

function Path({ icon, title, tag, steps }: { icon: string; title: string; tag?: string; steps: Step[] }) {
  return (
    <section className="lcs-guide__path">
      <h3 className="lcs-guide__path-title">
        <Icon name={icon} />
        {title}
        {tag && <span className="lcs-guide__tag">{tag}</span>}
      </h3>
      <ol className="lcs-guide__steps">
        {steps.map((step, i) => (
          <li key={i}>
            <span className="lcs-guide__step-icon">
              <Icon name={step.icon} />
            </span>
            <span>{step.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function MembersGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      // Stockage du navigateur indisponible : on s'en tient au nombre de liens.
    }
    let cancelled = false;
    fetch('/api/member-invite-links?limit=0&depth=0', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.totalDocs === 0) setOpen(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (next: boolean) => {
    setOpen(next);
    try {
      // Seul le choix de replier est retenu ; rouvrir revient à la règle par défaut.
      if (next) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Sans stockage, l'état n'est simplement pas retenu.
    }
  };

  return (
    <details
      className="lcs-guide"
      open={open}
      onToggle={(e) => {
        const next = (e.currentTarget as HTMLDetailsElement).open;
        if (next !== open) toggle(next);
      }}
    >
      <summary className="lcs-guide__summary">
        <span className="lcs-guide__badge">
          <Icon name="book" />
        </span>
        <span className="lcs-guide__heading">
          Mode d’emploi
          <span className="lcs-guide__sub">Donner accès à l’espace membres</span>
        </span>
        <Icon name="chevron" className="lcs-guide__chevron" />
      </summary>
      <div className="lcs-guide__body">
        <p className="lcs-guide__intro">
          Chaque membre y retrouve sa fiche et ses partitions. Pas de mot de passe, et jamais d’accès à
          l’administration.
        </p>
        <div className="lcs-guide__paths">
          <Path icon="users" title="Tout un groupe" tag="le plus simple" steps={GROUP_STEPS} />
          <Path icon="user" title="Une seule personne" steps={PERSON_STEPS} />
        </div>
        <p className="lcs-guide__tips-title">Bon à savoir</p>
        <ul className="lcs-guide__tips">
          {TIPS.map((tip, i) => (
            <li key={i}>
              <Icon name={tip.icon} className="lcs-guide__tip-icon" />
              <span>{tip.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

export default MembersGuide;
