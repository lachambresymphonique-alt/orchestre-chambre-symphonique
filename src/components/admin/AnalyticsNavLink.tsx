'use client';

import './admin-theme.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HREF = '/admin/google-analytics';

/** Lien « Google Analytics » dans la barre latérale de l'admin (même style que « Statistiques »). */
export function AnalyticsNavLink() {
  const pathname = usePathname();
  const active = pathname === HREF || pathname.startsWith(`${HREF}/`);

  return (
    <Link
      href={HREF}
      prefetch={false}
      className={`lcs-nav-stats lcs-nav-ga${active ? ' is-active' : ''}`}
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
        <path d="M5 15l4.5-5 3.5 3 6-7" />
        <path d="M15 6h4v4" />
      </svg>
      <span>Google Analytics</span>
    </Link>
  );
}

export default AnalyticsNavLink;
