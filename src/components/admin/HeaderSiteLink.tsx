import './admin-header.css';

/**
 * « Voir le site » dans la barre du haut de l'admin, juste à gauche de la photo
 * du compte. Rendu par l'emplacement `admin.components.actions`, présent sur
 * toutes les pages de l'admin. Remplace le lien qui vivait dans le menu de
 * gauche (ViewSiteLink).
 */
export function HeaderSiteLink() {
  return (
    <a
      className="lcs-header-link"
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      title="Ouvrir le site public dans un nouvel onglet"
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
        aria-hidden="true"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span className="lcs-header-link__label">Voir le site</span>
    </a>
  );
}

export default HeaderSiteLink;
