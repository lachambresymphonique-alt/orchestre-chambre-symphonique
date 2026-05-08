import './admin-theme.css';

export function ViewSiteLink() {
  return (
    <>
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="lcs-view-site"
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
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span>Voir le site</span>
      </a>

      <style>{`
        .lcs-view-site {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.65rem 0.85rem;
          margin: 0.5rem 0 0.75rem;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--theme-elevation-1000);
          text-decoration: none;
          border: 1px solid var(--theme-elevation-150);
          border-radius: 4px;
          transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
          width: 100%;
          justify-content: flex-start;
        }
        .lcs-view-site:hover {
          background: var(--theme-elevation-100);
          border-color: var(--theme-elevation-300);
          color: var(--theme-elevation-1000);
        }
        .lcs-view-site svg {
          flex-shrink: 0;
          color: var(--theme-elevation-600);
        }
        .lcs-view-site:hover svg {
          color: var(--theme-elevation-1000);
        }
      `}</style>
    </>
  );
}
