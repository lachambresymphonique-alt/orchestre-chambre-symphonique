import './admin-theme.css';
import { LogoSvg } from '../LogoSvg';

export function AdminIcon() {
  return (
    <span
      className="lcs-admin-icon"
      aria-label="La Chambre Symphonique"
    >
      <LogoSvg />
      <style>{`
        .lcs-admin-icon {
          display: inline-flex;
          align-items: center;
          height: 24px;
          color: var(--theme-elevation-1000);
        }
        .lcs-admin-icon svg {
          height: 24px;
          width: auto;
          max-width: none;
          display: block;
          flex-shrink: 0;
        }
      `}</style>
    </span>
  );
}
