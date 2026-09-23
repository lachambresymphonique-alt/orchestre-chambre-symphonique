'use client';

import './admin-theme.css';
// Icônes et couleurs du menu : chargées ici parce que ce lien est toujours rendu dans la barre latérale.
import './admin-nav-icons.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HREF = '/admin';

/** Lien « Accueil » (le tableau de bord) en tête de la barre latérale de l'admin. */
export function DashboardNavLink() {
  const pathname = usePathname();
  const active = pathname === HREF || pathname === `${HREF}/`;

  return (
    <Link
      href={HREF}
      prefetch={false}
      className={`lcs-nav-stats lcs-nav-home${active ? ' is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M4 10.5 12 4l8 6.5" />
        <path d="M6.2 9.6V20h11.6V9.6" />
        <path d="M10 20v-4.6h4V20" />
      </svg>
      <span>Accueil</span>
    </Link>
  );
}

export default DashboardNavLink;
