'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLivePreviewContext } from '@payloadcms/ui';

/**
 * Choix de l'écran de l'aperçu en direct, comme chez Shopify : quatre boutons
 * posés dans la barre de l'aperçu de Payload, à la place de sa liste
 * « Responsive » et de ses champs de taille.
 *
 * « Ordinateur » montre la vraie mise en page d'un écran large (1440 px),
 * réduite pour tenir dans le panneau : Payload élargit la page d'autant que le
 * zoom la réduit. Tablette et téléphone gardent leur taille réelle quand le
 * panneau est assez large, sinon ils sont réduits de la même façon.
 */

type Device = 'fit' | 'desktop' | 'tablet' | 'mobile';

const WIDTHS: Record<Exclude<Device, 'fit'>, number> = { desktop: 1440, tablet: 768, mobile: 375 };

const DEVICES: { device: Device; label: string; icon: string }[] = [
  { device: 'fit', label: 'Adapté au panneau', icon: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5' },
  { device: 'desktop', label: 'Ordinateur', icon: 'M3 5h18v11H3zM8 20h8M12 16v4' },
  { device: 'tablet', label: 'Tablette', icon: 'M6 3h12v18H6zM11 18h2' },
  { device: 'mobile', label: 'Téléphone', icon: 'M8 3h8v18H8zM11 18h2' },
];

const STORAGE_KEY = 'lcs-preview-device';

function readStored(): Device {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'desktop' || value === 'tablet' || value === 'mobile' ? value : 'fit';
  } catch {
    return 'fit';
  }
}

export function PreviewDevices() {
  const { isLivePreviewing, setBreakpoint, setZoom, zoom } = useLivePreviewContext();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [device, setDevice] = useState<Device>(readStored);

  // La barre de l'aperçu n'existe que panneau ouvert, et arrive après nous.
  useEffect(() => {
    if (!isLivePreviewing) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      const found = document.querySelector<HTMLElement>('.live-preview-toolbar-controls');
      if (found || ++tries > 25) {
        window.clearInterval(timer);
        setHost(found);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [isLivePreviewing]);

  const apply = useCallback(
    (next: Device) => {
      const pane = document.querySelector<HTMLElement>('.live-preview-window')?.getBoundingClientRect().width ?? 0;
      if (next === 'fit' || !pane) {
        setBreakpoint('responsive');
        setZoom(1);
      } else if (next !== 'desktop' && pane >= WIDTHS[next]) {
        setBreakpoint(next);
        setZoom(1);
      } else {
        // Pleine largeur du panneau, avec une page aussi large que l'écran visé.
        setBreakpoint('responsive');
        setZoom(Math.min(1, Math.floor((pane / WIDTHS[next]) * 100) / 100));
      }
    },
    [setBreakpoint, setZoom],
  );

  // Dernier écran choisi, et réglage refait quand le panneau change de largeur.
  useEffect(() => {
    if (host) apply(device);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une fois, à l'arrivée de la barre
  }, [host, apply]);

  useEffect(() => {
    const pane = document.querySelector<HTMLElement>('.live-preview-window');
    if (!host || !pane || device === 'fit') return;
    let last = pane.getBoundingClientRect().width;
    const observer = new ResizeObserver(() => {
      const width = pane.getBoundingClientRect().width;
      if (Math.abs(width - last) < 8) return;
      last = width;
      apply(device);
    });
    observer.observe(pane);
    return () => observer.disconnect();
  }, [host, device, apply]);

  const choose = (next: Device) => {
    setDevice(next);
    apply(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Stockage indisponible : le choix vaut pour cette page seulement.
    }
  };

  if (!host) return null;
  return createPortal(
    <div className="lcs-devices" role="group" aria-label="Écran de l’aperçu">
      {/* Remplace la liste « Responsive », les champs de taille et le zoom de Payload. */}
      <style>{`.live-preview-toolbar-controls > .popup, .live-preview-toolbar-controls__device-size { display: none !important; }`}</style>
      {DEVICES.map(({ device: value, label, icon }) => (
        <button
          key={value}
          type="button"
          className={`lcs-devices__btn${device === value ? ' is-active' : ''}`}
          onClick={() => choose(value)}
          title={label}
          aria-label={label}
          aria-pressed={device === value}
        >
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
        </button>
      ))}
      {zoom < 1 && (
        <span className="lcs-devices__zoom" title="L’aperçu est réduit pour tenir dans le panneau">
          {Math.round(zoom * 100)} %
        </span>
      )}
    </div>,
    host,
  );
}

export default PreviewDevices;
