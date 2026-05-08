import './admin-theme.css';
import { LogoSvg } from '../LogoSvg';

export function AdminLogo() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '18px',
        padding: '12px 0 6px',
        color: 'var(--theme-elevation-1000)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: '64px',
        }}
      >
        <LogoSvg />
      </span>
      <div
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '11px',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--theme-elevation-500)',
          fontWeight: 500,
        }}
      >
        Espace d’administration
      </div>
      <style>{`
        div > span > svg { height: 64px; width: auto; display: block; }
      `}</style>
    </div>
  );
}
