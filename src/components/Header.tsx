'use client';

import './nav-submenu.css';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoSvg } from './LogoSvg';
import { DEFAULT_NAV_ITEMS, resolveNavItems, type NavLink, type NavigationDoc } from '@/lib/navigation';
import { useLiveGlobal } from '@/hooks/useLiveDocument';

function renderLink(item: NavLink, active: boolean) {
  const className = active ? 'active' : '';
  if (item.external || item.newTab) {
    return (
      <a
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
    <Link href={item.href} className={className} aria-current={active ? 'page' : undefined}>
      {item.label}
    </Link>
  );
}

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
  // Sous-menu ouvert (au clic, au clavier, et toujours sur mobile) ; le survol
  // l'ouvre aussi sur ordinateur (voir nav-submenu.css).
  const [openGroup, setOpenGroup] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);
  // Actif sur la page et sur ses sous-pages (/blog/mon-article, /musiciens/…).
  // Une adresse avec paramètres (/blog?rubrique=projet) compte pour sa page.
  const isActive = (href: string) => {
    const path = href.split('?')[0];
    return !!path && (pathname === path || (path !== '/' && pathname.startsWith(`${path}/`)));
  };
  const isGroupActive = (item: NavLink) => !!item.children?.some((child) => isActive(child.href));

  // Échap ou clic en dehors : le sous-menu se referme.
  useEffect(() => {
    if (openGroup === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenGroup(null);
    };
    const onPointer = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenGroup(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [openGroup]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setOpenGroup(null);
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

        <nav ref={navRef} className={`nav-main${menuOpen ? ' open' : ''}`}>
          {navItems.map((item, i) => {
            const key = `${item.href || item.label}-${i}`;
            if (item.children?.length) {
              const open = openGroup === i;
              const menuId = `nav-submenu-${i}`;
              return (
                <div
                  key={key}
                  className={`nav-group${open ? ' is-open' : ''}${isGroupActive(item) ? ' active' : ''}`}
                >
                  <button
                    type="button"
                    className="nav-group__toggle"
                    aria-expanded={open}
                    aria-controls={menuId}
                    onClick={() => setOpenGroup(open ? null : i)}
                  >
                    {item.label}
                    <span className="nav-group__chevron" aria-hidden="true" />
                  </button>
                  <ul id={menuId} className="nav-submenu">
                    {item.children.map((child, j) => (
                      <li key={`${child.href}-${j}`}>{renderLink(child, isActive(child.href))}</li>
                    ))}
                  </ul>
                </div>
              );
            }
            return <span key={key} className="nav-item">{renderLink(item, isActive(item.href))}</span>;
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
