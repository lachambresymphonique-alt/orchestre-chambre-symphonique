import './admin-theme.css';
import Link from 'next/link';
import type { Payload } from 'payload';
import { getPayloadClient } from '@/lib/payload';
import { formatCount, getVisitSummary, plural, type VisitSummary } from '@/lib/stats';

type Shortcut = {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  hint: string;
};

const stroke = { stroke: 'currentColor', strokeWidth: 1.4, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path {...stroke} d="M4 11l8-7 8 7" />
    <path {...stroke} d="M6 10v9h12v-9" />
    <path {...stroke} d="M10 19v-5h4v5" />
  </svg>
);

const NoteIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <circle {...stroke} cx="7" cy="17" r="2.5" />
    <circle {...stroke} cx="17" cy="15" r="2.5" />
    <path {...stroke} d="M9.5 17V6l10-2v11" />
    <path {...stroke} d="M9.5 9l10-2" />
  </svg>
);

const PeopleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <circle {...stroke} cx="9" cy="9" r="3.2" />
    <circle {...stroke} cx="17" cy="10" r="2.4" />
    <path {...stroke} d="M3 19c0-3 2.7-5 6-5s6 2 6 5" />
    <path {...stroke} d="M14.5 19c0-2.4 1.7-4 3.5-4s3 1.4 3 3.5" />
  </svg>
);

const MediaIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <rect {...stroke} x="3" y="5" width="18" height="14" rx="2" />
    <path d="M11 9.5l4.5 2.5L11 14.5z" fill="currentColor" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <rect {...stroke} x="3" y="5.5" width="18" height="13" rx="2" />
    <path {...stroke} d="M3.5 7l8.5 6 8.5-6" />
  </svg>
);

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <rect {...stroke} x="3" y="5" width="18" height="14" rx="2" />
    <circle {...stroke} cx="9" cy="10.5" r="1.6" />
    <path {...stroke} d="M4.5 17l4.5-4 4 3.5 3-2.5 4 4" />
  </svg>
);

const PenIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path {...stroke} d="M4 20l4-1 10.5-10.5a2.1 2.1 0 00-3-3L5 16l-1 4z" />
    <path {...stroke} d="M13.5 7.5l3 3" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" style={{ marginLeft: 4 }}>
    <path {...stroke} d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

const TipIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path {...stroke} d="M9 17h6M10 20h4" />
    <path {...stroke} d="M12 3a6 6 0 00-4 10.5c.7.6 1 1.4 1 2.5h6c0-1.1.3-1.9 1-2.5A6 6 0 0012 3z" />
  </svg>
);

const shortcuts: Shortcut[] = [
  {
    href: '/admin/globals/home-page',
    title: 'Page d’accueil',
    description: 'Modifier la bannière, la présentation et la newsletter.',
    icon: <HomeIcon />,
    hint: 'Modifier',
  },
  {
    href: '/admin/collections/concerts/create',
    title: 'Nouveau concert',
    description: 'Annoncer une date : jour, heure, lieu, programme et billetterie.',
    icon: <NoteIcon />,
    hint: 'Ajouter',
  },
  {
    href: '/admin/collections/musicians',
    title: 'Musiciens',
    description: 'Gérer la liste des membres de l’orchestre par section.',
    icon: <PeopleIcon />,
    hint: 'Voir',
  },
  {
    href: '/admin/collections/media-items',
    title: 'Médias',
    description: 'Ajouter une vidéo, un extrait audio ou des photos.',
    icon: <MediaIcon />,
    hint: 'Gérer',
  },
  {
    href: '/admin/collections/posts/create',
    title: 'Nouvel article',
    description: 'Écrire un retour sur un projet, un entretien ou une actualité pour le blog.',
    icon: <PenIcon />,
    hint: 'Écrire',
  },
  {
    href: '/admin/collections/contact-submissions',
    title: 'Messages reçus',
    description: 'Consulter les messages envoyés via le formulaire de contact.',
    icon: <MailIcon />,
    hint: 'Consulter',
  },
  {
    href: '/admin/collections/media',
    title: 'Bibliothèque d’images',
    description: 'Téléverser et gérer toutes les photos du site.',
    icon: <ImageIcon />,
    hint: 'Ouvrir',
  },
];

type Props = { payload?: Payload };

export async function BeforeDashboard({ payload }: Props) {
  // Fréquentation : décorative, ne doit jamais bloquer le tableau de bord.
  let visits: VisitSummary | null = null;
  try {
    visits = await getVisitSummary(payload ?? (await getPayloadClient()));
  } catch (error) {
    console.error('Tableau de bord : fréquentation indisponible', error);
  }

  return (
    <div className="lcs-dashboard-intro">
      <section className="lcs-welcome">
        <div className="lcs-welcome__eyebrow">Espace d’administration</div>
        <h1 className="lcs-welcome__title">
          Bienvenue à <em>La Chambre Symphonique</em>
        </h1>
        <p className="lcs-welcome__subtitle">
          Vous êtes ici pour mettre à jour le site. Choisissez un raccourci
          ci-dessous, ou utilisez le menu de gauche pour naviguer entre les pages,
          le contenu et les paramètres.
        </p>
      </section>

      {visits && <VisitsStrip visits={visits} />}

      <div className="lcs-tip">
        <span className="lcs-tip__icon" aria-hidden="true">
          <TipIcon />
        </span>
        <span>
          <strong>Conseil&nbsp;:</strong> chaque modification est enregistrée
          uniquement après avoir cliqué sur le bouton <strong>Sauvegarder</strong>{' '}
          en haut à droite. Vous pouvez prévisualiser une page avant de publier
          grâce au bouton <strong>Aperçu en direct</strong>.
        </span>
      </div>

      <nav aria-label="Raccourcis rapides" className="lcs-shortcuts">
        {shortcuts.map((s) => (
          <Link key={s.href} href={s.href} className="lcs-shortcut">
            <span className="lcs-shortcut__icon" aria-hidden="true">
              {s.icon}
            </span>
            <span className="lcs-shortcut__title">{s.title}</span>
            <span className="lcs-shortcut__desc">{s.description}</span>
            <span className="lcs-shortcut__hint">
              {s.hint}
              <ArrowIcon />
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

// ─── Bandeau « Fréquentation du site » ───────────────────────────────────────

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path {...stroke} d="M4 19h16" />
    <path {...stroke} d="M7 15V9" />
    <path {...stroke} d="M12 15V5" />
    <path {...stroke} d="M17 15v-4" />
  </svg>
);

function VisitsStrip({ visits }: { visits: VisitSummary }) {
  const tiles = [
    { label: 'Aujourd’hui', totals: visits.today },
    { label: '7 derniers jours', totals: visits.last7 },
    { label: '30 derniers jours', totals: visits.last30 },
  ];

  return (
    <section className="lcs-visits" aria-label="Fréquentation du site">
      <div className="lcs-visits__head">
        <div className="lcs-visits__intro">
          <span className="lcs-visits__icon" aria-hidden="true">
            <ChartIcon />
          </span>
          <div>
            <div className="lcs-visits__eyebrow">Fréquentation du site</div>
            <p className="lcs-visits__sub">
              Visiteurs comptés une fois par jour, hors administrateurs connectés.
            </p>
          </div>
        </div>
        <Link href="/admin/statistiques" className="lcs-visits__link">
          Voir les statistiques
          <ArrowIcon />
        </Link>
      </div>
      <div className="lcs-visits__tiles">
        {tiles.map((t) => (
          <div key={t.label} className="lcs-visits__tile">
            <div className="lcs-visits__label">{t.label}</div>
            <div className="lcs-visits__value">
              {formatCount(t.totals.visitors)}{' '}
              <span className="lcs-visits__unit">{t.totals.visitors > 1 ? 'visiteurs' : 'visiteur'}</span>
            </div>
            <div className="lcs-visits__hint">{plural(t.totals.views, 'page vue', 'pages vues')}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
