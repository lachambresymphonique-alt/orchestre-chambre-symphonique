'use client';

import { Component, type ReactNode } from 'react';
import { useLivePreview } from '@payloadcms/live-preview-react';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { FreePageContent } from './FreePageContent';

/**
 * Aperçu en direct d'une page libre, affiché dans l'admin à côté du
 * formulaire (route /apercu/pages, voir collections/Pages.ts).
 *
 * Tout vient de l'admin : à chaque modification, Payload envoie le contenu du
 * formulaire à cette fenêtre (postMessage, même origine). Rien n'est lu en
 * base ici : l'aperçu fonctionne donc pour une page en cours de création, pour
 * un brouillon et pour une modification pas encore publiée.
 */

type PageData = {
  title?: string | null;
  content?: unknown;
};

type RequestHandler = NonNullable<Parameters<typeof useLivePreview>[0]['requestHandler']>;

const EMPTY_PAGE: PageData = {};

// Réponses hors d'ordre : une réponse plus ancienne qui arrive après une plus
// récente ne doit pas réafficher un état périmé.
let lastIssued = 0;
let lastApplied = 0;
let lastBody = '{}';

/**
 * Complète le contenu saisi (images et liens insérés dans le texte) via l'API
 * de Payload. L'API complète les données envoyées quel que soit l'identifiant
 * demandé : on interroge l'identifiant 0, qui n'existe jamais, ce qui marche
 * aussi pendant la création, quand la page n'a pas encore d'identifiant.
 * En cas d'échec, on affiche le texte tel quel plutôt qu'un aperçu vide.
 */
export const populate: RequestHandler = async ({ apiPath, data, serverURL }) => {
  const seq = ++lastIssued;
  let body: string | null = null;
  try {
    const res = await fetch(`${serverURL}${apiPath}/pages/0`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Payload-HTTP-Method-Override': 'GET' },
      body: JSON.stringify(data),
    });
    if (res.ok) body = await res.text();
  } catch {
    // réseau indisponible : repli ci-dessous
  }
  if (body === null) body = JSON.stringify((data as { data?: unknown })?.data ?? {});

  if (seq < lastApplied) {
    body = lastBody;
  } else {
    lastApplied = seq;
    lastBody = body;
  }
  return new Response(body, { headers: { 'Content-Type': 'application/json' } });
};

export function PagePreview() {
  const serverURL = typeof window !== 'undefined' ? window.location.origin : '';
  const { data } = useLivePreview<PageData>({
    initialData: EMPTY_PAGE,
    serverURL,
    depth: 1,
    requestHandler: populate,
  });

  useLivePreviewSync(data);

  return (
    <PreviewBoundary resetKey={data}>
      <FreePageContent title={data?.title} content={data?.content} placeholders />
    </PreviewBoundary>
  );
}

/** Un contenu momentanément illisible ne doit pas casser l'aperçu : il revient à la frappe suivante. */
class PreviewBoundary extends Component<{ resetKey: unknown; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prev: { resetKey: unknown }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }

  render() {
    if (this.state.failed) {
      return (
        <main>
          <section className="section">
            <div className="container">
              <p style={{ opacity: 0.6 }}>L’aperçu ne peut pas afficher ce contenu pour l’instant. Il se mettra à jour à la prochaine modification.</p>
            </div>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

export default PagePreview;
