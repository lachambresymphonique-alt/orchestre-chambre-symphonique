'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoSvg } from './LogoSvg';
import { DEFAULT_NAV_ITEMS, resolveNavItems, type NavLink, type NavigationDoc } from '@/lib/navigation';
import { useLiveGlobal } from '@/hooks/useLiveDocument';

export function Header({ items }: { items?: NavLink[] }) {
  // Menu composé dans l'admin (Réglages → Menu du site), sinon menu historique.
  // Une liste vide est respectée : toutes les entrées ont été masquées.
  // Aperçu en direct du « Menu du site » : dès que l'admin envoie une version,
  // elle remplace le menu reçu du serveur.
  const liveNav = useLiveGlobal<NavigationDoc | null>('navigation', null, 1);
  const navItems = liveNav ? resolveNavItems(liveNav) : items ?? DEFAULT_NAV_ITEMS;
  // Aperçu en direct de « Apparence du site » : typographie des titres.
  const liveTheme = useLiveGlobal<{ displayFont?: string } | null>('theme-settings', null, 0);
  useEffect(() => {
    if (liveTheme?.displayFont) document.documentElement.dataset.display = liveTheme.displayFont;
  }, [liveTheme?.displayFont]);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  // Actif sur la page et sur ses sous-pages (/journal/mon-article, /musiciens/…).
  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    document.body.style.overflow = '';
  }, [pathname]);

  const toggleMenu = () => {
    setMenuOpen((prev) => {
      document.body.style.overflow = !prev ? 'hidden' : '';
      return !prev;
    });
  };

  return (
    <header className={`header${scrolled ? ' scrolled' : ''}`}>
      <div className="container">
        <Link href="/" className="logo" aria-label="La Chambre Symphonique — Orchestre, accueil">
          <LogoSvg />
        </Link>

        <nav className={`nav-main${menuOpen ? ' open' : ''}`}>
          {navItems.map((item, i) => {
            const key = `${item.href}-${i}`;
            const className = isActive(item.href) ? 'active' : '';
            if (item.external || item.newTab) {
              return (
                <a
                  key={key}
                  href={item.href}
                  className={className}
                  target={item.newTab ? '_blank' : undefined}
                  rel={item.newTab ? 'noopener noreferrer' : undefined}
                >
                  {item.label}
                </a>
              );
            }
            return (
              <Link key={key} href={item.href} className={className}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          className={`hamburger${menuOpen ? ' active' : ''}`}
          onClick={toggleMenu}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}
