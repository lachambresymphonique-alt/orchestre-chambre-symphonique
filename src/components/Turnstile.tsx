'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

/**
 * Widget Cloudflare Turnstile (captcha invisible, sans cookie ni donnée personnelle).
 * Rendu explicite pour rester fiable malgré les montages/démontages React.
 * Remonter le composant (changer sa `key`) suffit à obtenir un nouveau jeton.
 */

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __onTurnstileLoad?: () => void;
  }
}

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__onTurnstileLoad&render=explicit';

type TurnstileProps = {
  siteKey: string;
  /** Reçoit le jeton, ou `null` quand il expire / échoue. */
  onToken: (token: string | null) => void;
  /** Le widget n'a pas pu se charger ou a rencontré une erreur. */
  onError?: () => void;
};

export function Turnstile({ siteKey, onToken, onError }: TurnstileProps) {
  const container = useRef<HTMLDivElement>(null);
  // Refs pour que les callbacks les plus récents soient appelés sans re-rendre le widget.
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);
  onTokenRef.current = onToken;
  onErrorRef.current = onError;

  useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;

    const render = () => {
      if (cancelled || widgetId || !container.current || !window.turnstile) return;
      widgetId = window.turnstile.render(container.current, {
        sitekey: siteKey,
        theme: 'dark',
        language: 'fr',
        size: 'flexible',
        'refresh-expired': 'auto',
        callback: (token: string) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(null),
        'error-callback': () => {
          onTokenRef.current(null);
          onErrorRef.current?.();
        },
      });
    };

    if (window.turnstile) render();
    else window.__onTurnstileLoad = render;

    return () => {
      cancelled = true;
      if (window.__onTurnstileLoad === render) window.__onTurnstileLoad = undefined;
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // Widget déjà retiré.
        }
      }
    };
  }, [siteKey]);

  return (
    <>
      <Script src={SCRIPT_SRC} strategy="afterInteractive" />
      <div ref={container} />
    </>
  );
}
