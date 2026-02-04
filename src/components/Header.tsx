'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoSvg } from './LogoSvg';

const navItems = [
  { href: '/', label: 'Accueil' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/musiciens', label: 'Musiciens' },
  { href: '/medias', label: 'Médias' },
  { href: '/nous-soutenir', label: 'Nous soutenir' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
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
            <span className="name">Chambre Symphonique</span>
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
