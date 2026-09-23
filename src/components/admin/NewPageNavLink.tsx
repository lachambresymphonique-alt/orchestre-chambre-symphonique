'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

/**
 * Entrée « Créer une page » au bas du groupe Pages de la barre latérale.
 *
 * Payload n'offre que deux emplacements pour la navigation, avant ou après
 * tous les groupes. Ce composant est donc déclaré en `afterNavLinks` puis se
 * replace lui-même à la fin du groupe Pages, repéré par le lien de la
 * collection (identifiant `nav-pages`, posé par Payload). Il reprend la classe
 * `nav__link` pour être indiscernable des autres entrées.
 *
 * L'icône n'est pas dessinée ici : elle est confiée à la variable
 * `--lcs-nav-icon` qu'utilise la feuille `admin-nav-icons.css` pour toutes les
 * entrées. Si cette feuille n'est pas chargée, la variable est simplement
 * ignorée et l'entrée s'affiche comme les autres, sans icône.
 *
 * Si la structure de la barre latérale changeait lors d'une mise à jour de
 * Payload, le lien ne s'afficherait simplement pas : rien ne casse.
 */

const CREATE_HREF = '/admin/collections/pages/create';

/** Plus cerclé, au trait des autres icônes de la barre latérale. */
const ICON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='8.4'/%3E%3Cpath d='M12 8.4v7.2'/%3E%3Cpath d='M8.4 12h7.2'/%3E%3C/svg%3E\")";

const linkStyle = { '--lcs-nav-icon': ICON } as CSSProperties;

export function NewPageNavLink() {
  const pathname = usePathname();
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    /** Conteneur du groupe qui contient le lien de la collection Pages. */
    const locate = () => {
      const pagesLink = document.getElementById('nav-pages');
      const content = pagesLink?.parentElement ?? null;
      setHost((current) => (current === content ? current : content));
    };

    locate();

    // La barre latérale se re-rend (ouverture d'un groupe, navigation, tiroir
    // mobile) : on retrouve alors son nouveau conteneur.
    const nav = document.querySelector('.nav');
    if (!nav) return;
    const observer = new MutationObserver(locate);
    observer.observe(nav, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  if (!host) return null;

  const isActive = pathname === CREATE_HREF;

  return createPortal(
    <Link
      className="nav__link"
      href={CREATE_HREF}
      id="nav-create-page"
      prefetch={false}
      aria-current={isActive ? 'page' : undefined}
      style={linkStyle}
    >
      <span className="nav__link-label">Créer une page</span>
    </Link>,
    host,
  );
}

export default NewPageNavLink;
