'use client';

import './admin-theme.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HREF = '/admin/statistiques';

/** Lien « Statistiques » dans la barre latérale de l'admin, sous « Voir le site ». */
export function StatsNavLink() {
  const pathname = usePathname();
  const active = pathname === HREF || pathname.startsWith(`${HREF}/`);

  return (
    <Link
      href={HREF}
      prefetch={false}
      className={`lcs-nav-stats${active ? ' is-active' : ''}`}
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
        <path d="M4 19h16" />
        <path d="M7 15V9" />
        <path d="M12 15V5" />
        <path d="M17 15v-4" />
      </svg>
      <span>Statistiques</span>
    </Link>
  );
}

export default StatsNavLink;
