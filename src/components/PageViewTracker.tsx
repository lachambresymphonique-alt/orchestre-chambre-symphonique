'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Compteur de visites maison : envoie un signal à `/api/visite` à chaque page
 * vue. Pas de cookie, pas de script tiers ; l'anonymisation se fait côté
 * serveur (voir la route). Silencieux en cas d'échec : la mesure ne doit
 * jamais gêner la lecture du site.
 */

const ENDPOINT = '/api/visite';

// Vrai dès que la première page vue de ce chargement a été envoyée. Les
// navigations suivantes se font sans rechargement : ce ne sont jamais des
// « arrivées » sur le site.
let entrySent = false;

function send(body: Record<string, unknown>) {
  const json = JSON.stringify(body);
  try {
    if (typeof navigator.sendBeacon === 'function') {
      const sent = navigator.sendBeacon(ENDPOINT, new Blob([json], { type: 'application/json' }));
      if (sent) return;
    }
  } catch {
    // on retombe sur fetch
  }
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: json,
    keepalive: true,
  }).catch(() => {});
}

export function PageViewTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;

    try {
      // Aperçu en direct de l'admin (iframe) et navigateurs automatisés : ignorés.
      if (window.self !== window.top) return;
      if (navigator.webdriver) return;

      let referrer = '';
      let internal = false;
      if (document.referrer) {
        try {
          const from = new URL(document.referrer);
          if (from.host === window.location.host) internal = true;
          else referrer = document.referrer;
        } catch {
          // provenance illisible : on l'ignore
        }
      }

      const entry = !entrySent && !internal;
      entrySent = true;

      send({
        path: pathname,
        referrer: entry ? referrer : '',
        entry,
        width: window.innerWidth,
      });
    } catch {
      // jamais d'erreur visible pour le visiteur
    }
  }, [pathname]);

  return null;
}
