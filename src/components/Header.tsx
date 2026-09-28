'use client';

import './nav-submenu.css';
import './mobile-menu.css';
import { useState, useEffect, useRef, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoSvg } from './LogoSvg';
import { socialLinksOf, type SocialSettings } from './SocialIcons';
import { DEFAULT_NAV_ITEMS, resolveNavItems, type NavLink, type NavigationDoc } from '@/lib/navigation';
import type { NextConcertTeaser } from '@/lib/nextConcert';
import { useLiveGlobal } from '@/hooks/useLiveDocument';

/** Au-delà, le menu s'affiche en ligne dans l'en-tête (voir nav-submenu.css). */
const DESKTOP_QUERY = '(min-width: 969px)';

function renderLink(item: NavLink, active: boolean, className = '', style?: CSSProperties) {
  const cls = [className, active ? 'active' : ''].filter(Boolean).join(' ') || undefined;
  if (item.external || item.newTab) {
    return (
      <a
        href={item.href}
        className={cls}
        style={style}
        target={item.newTab ? '_blank' : undefined}
        rel={item.newTab ? 'noopener noreferrer' : undefined}
      >
        {item.label}
      </a>
    );
  }
  return (
    <Link href={item.href} className={cls} style={style} aria-current={active ? 'page' : undefined}>
      {item.label}
    </Link>
  );
}

export function Header({
  items,
  nextConcert = null,
  email,
  social,
}: {
  items?: NavLink[];
  /** Prochain concert, rappelé dans le menu mobile. */
  nextConcert?: NextConcertTeaser | null;
  /** Coordonnées et réseaux (Paramètres du site), en pied du menu mobile. */
  email?: string | null;
  social?: SocialSettings;
}) {
  // Menu composé dans l'admin (Réglages → Menu du site), sinon menu historique.
  // Une liste vide est respectée : toutes les entrées ont été masquées.
  // Aperçu en direct du « Menu du site » : dès que l'admin envoie une version,
  // elle remplace le menu reçu du serveur.
  const liveNav = useLiveGlobal<NavigationDoc | null>('navigation', null, 1);
  const navItems = liveNav ? resolveNavItems(liveNav) : items ?? DEFAULT_NAV_ITEMS;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  // Sous-menu ouvert sur ordinateur (au clic, au clavier) ; le survol l'ouvre
  // aussi (voir nav-submenu.css).
  const [openGroup, setOpenGroup] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Actif sur la page et sur ses sous-pages (/blog/mon-article, /musiciens/…).
  // Une adresse avec paramètres (/blog?rubrique=projet) compte pour sa page.
  const isActive = (href: string) => {
    const path = href.split('?')[0];
    return !!path && (pathname === path || (path !== '/' && pathname.startsWith(`${path}/`)));
  };
  const isGroupActive = (item: NavLink) => !!item.children?.some((child) => isActive(child.href));
  const socialLinks = socialLinksOf(social);

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
  }, [pathname]);

  // Menu mobile ouvert : la page ne défile plus, le premier lien prend le
  // focus, Tab reste dans le menu, Échap le referme. Passer en largeur
  // ordinateur (rotation d'une tablette) le referme aussi.
  useEffect(() => {
    if (!menuOpen) return;
    const root = document.documentElement;
    root.classList.add('menu-is-open');

    const focusables = () =>
      [toggleRef.current, ...Array.from(panelRef.current?.querySelectorAll<HTMLElement>('a[href]') ?? [])].filter(
        (el): el is HTMLElement => !!el,
      );
    const frame = requestAnimationFrame(() => focusables()[1]?.focus({ preventScroll: true }));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab') return;
      const list = focusables();
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onDesktop = () => desktop.matches && setMenuOpen(false);

    document.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onDesktop);
    return () => {
      cancelAnimationFrame(frame);
      root.classList.remove('menu-is-open');
      document.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onDesktop);
    };
  }, [menuOpen]);

  // Rang d'apparition de chaque ligne du menu mobile (entrée en cascade).
  let rank = 0;
  const stagger = (): CSSProperties => ({ '--i': rank++ } as CSSProperties);

  return (
    <>
      <header className={`header${scrolled ? ' scrolled' : ''}${menuOpen ? ' is-menu-open' : ''}`}>
        <div className="container">
          <Link href="/" className="logo" aria-label="La Chambre Symphonique — Orchestre, accueil">
            <LogoSvg />
          </Link>

          <nav ref={navRef} className="nav-main" aria-label="Menu principal">
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

          {/* « Billets » : les dates et la billetterie du prochain concert. Sur
              mobile, entre le logo et le bouton du menu ; sur ordinateur, au
              bout du menu. */}
          {nextConcert?.ticketsHref && (
            <Link href={nextConcert.ticketsHref} className="header-tickets">
              Billets
            </Link>
          )}

          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="menu-toggle__label">{menuOpen ? 'Fermer' : 'Menu'}</span>
            <span className="menu-toggle__icon" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      {/* Menu mobile : plein écran, sous la barre de l'en-tête. Hors du
          <header>, dont le flou d'arrière-plan enfermerait un élément fixe. */}
      <div
        ref={panelRef}
        id="mobile-menu"
        className={`mobile-menu${menuOpen ? ' is-open' : ''}`}
        inert={!menuOpen}
      >
        <div className="mobile-menu__halo" aria-hidden="true" />
        <nav className="mobile-menu__nav" aria-label="Menu principal">
          <ul className="mobile-menu__list">
            {navItems.map((item, i) => {
              const key = `${item.href || item.label}-${i}`;
              if (item.children?.length) {
                return (
                  <li key={key} className="mobile-menu__group">
                    <p className="mobile-menu__group-title" style={stagger()}>
                      {item.label}
                    </p>
                    <ul>
                      {item.children.map((child, j) => (
                        <li key={`${child.href}-${j}`}>
                          {renderLink(child, isActive(child.href), 'mobile-menu__link', stagger())}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              }
              return (
                <li key={key}>{renderLink(item, isActive(item.href), 'mobile-menu__link', stagger())}</li>
              );
            })}
          </ul>
        </nav>

        <div className="mobile-menu__foot" style={stagger()}>
          {nextConcert ? (
            <Link href={nextConcert.href} className="mobile-menu__concert">
              <span className="mobile-menu__concert-date">
                <span className="mobile-menu__concert-day">{nextConcert.day}</span>
                <span className="mobile-menu__concert-month">{nextConcert.month}</span>
              </span>
              <span className="mobile-menu__concert-text">
                <span className="mobile-menu__concert-eyebrow">
                  <span>{nextConcert.cancelled ? 'Concert annulé' : 'Prochain concert'}</span>
                  {nextConcert.where && <span className="mobile-menu__concert-city">{nextConcert.where}</span>}
                </span>
                <span className="mobile-menu__concert-title">{nextConcert.title}</span>
              </span>
            </Link>
          ) : null}
          <Link href="/concerts" className="mobile-menu__all-concerts">
            Tous les concerts <span aria-hidden="true">→</span>
          </Link>

          {(email || socialLinks.length > 0) && (
            <div className="mobile-menu__contact">
              {email && (
                <a href={`mailto:${email}`} className="mobile-menu__email">
                  {email}
                </a>
              )}
              {socialLinks.length > 0 && (
                <div className="mobile-menu__social">
                  {socialLinks.map(({ key, label, href, Icon }) => (
                    <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                      <Icon />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
