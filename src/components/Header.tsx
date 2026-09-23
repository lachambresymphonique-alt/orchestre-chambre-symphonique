'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoSvg } from './LogoSvg';
import { DEFAULT_NAV_ITEMS, type NavLink } from '@/lib/navigation';

export function Header({ items }: { items?: NavLink[] }) {
  // Menu composé dans l'admin (Réglages → Menu du site), sinon menu historique.
  // Une liste vide est respectée : toutes les entrées ont été masquées.
  const navItems = items ?? DEFAULT_NAV_ITEMS;
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
