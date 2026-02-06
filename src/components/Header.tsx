'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoSvg } from './LogoSvg';
import { ThemeToggle } from './ThemeProvider';

const defaultNavItems = [
  { href: '/', label: 'Accueil', order: 1 },
  { href: '/a-propos', label: 'À propos', order: 2 },
  { href: '/musiciens', label: 'Musiciens', order: 3 },
  { href: '/medias', label: 'Médias', order: 4 },
  { href: '/nous-soutenir', label: 'Nous soutenir', order: 5 },
  { href: '/contact', label: 'Contact', order: 6 },
];

type NavItem = { href: string; label: string; order: number };

export function Header({ extraNavItems = [] }: { extraNavItems?: NavItem[] }) {
  const navItems = [...defaultNavItems, ...extraNavItems].sort((a, b) => a.order - b.order);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

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
        <Link href="/" className="logo">
          <div className="logo-icon">
            <LogoSvg />
          </div>
          <div className="logo-text">
            <span className="name">La Chambre Symphonique</span>
            <span className="subtitle">Orchestre</span>
          </div>
        </Link>

        <nav className={`nav-main${menuOpen ? ' open' : ''}`}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <ThemeToggle />

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
