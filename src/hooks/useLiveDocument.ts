'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Aperçu en direct, fiche par fiche.
 *
 * L'admin envoie à l'aperçu, à chaque frappe, le contenu du formulaire ouvert :
 * `{ type: 'payload-live-preview', collectionSlug | globalSlug, data }`.
 * `useLivePreview` (de Payload) applique ce message à la page quelle que soit
 * la fiche éditée : une page qui affiche plusieurs fiches (l'accueil montre la
 * page d'accueil, les concerts, les partenaires…) recevait donc un concert à
 * la place de sa page d'accueil.
 *
 * Ces hooks ne retiennent que la fiche qui les concerne :
 * - `useLiveGlobal('home-page', initial)` : une page globale ;
 * - `useLiveDoc('musicians', initial)` : une fiche précise (même identifiant) ;
 * - `useLiveList('partners', items)` : une liste, dont l'élément modifié est
 *   remplacé (ou ajouté s'il est en cours de création).
 *
 * Les relations (photos, fiches liées) sont peuplées par l'API de Payload,
 * comme le fait `useLivePreview`. Hors de l'aperçu, rien ne se passe : les
 * données du serveur sont rendues telles quelles.
 */

type Doc = { id?: string | number | null } & Record<string, any>;

type LiveMessage = {
  type: 'payload-live-preview';
  collectionSlug?: string;
  globalSlug?: string;
  data?: Doc;
  locale?: string;
  ready?: boolean;
};

const isInIframe = () => typeof window !== 'undefined' && window.self !== window.top;

function isLiveMessage(event: MessageEvent): event is MessageEvent<LiveMessage> {
  return (
    event.origin === window.location.origin &&
    typeof event.data === 'object' &&
    event.data !== null &&
    event.data.type === 'payload-live-preview' &&
    !event.data.ready
  );
}

let announced = false;
/** Signale à l'admin que l'aperçu écoute (sans cela il n'envoie rien). */
function announceReady() {
  if (announced || !isInIframe()) return;
  announced = true;
  try {
    (window.opener || window.parent)?.postMessage({ type: 'payload-live-preview', ready: true }, window.location.origin);
  } catch {
    // Admin sur une autre origine.
  }
}

/** Peuple les relations du formulaire via l'API, comme `useLivePreview`. */
async function populate(target: { collection?: string; global?: string }, data: Doc, depth: number, locale?: string): Promise<Doc> {
  // L'API peuple les données envoyées quel que soit l'identifiant demandé :
  // une fiche en cours de création (sans identifiant) passe par l'identifiant 0.
  const endpoint = target.global
    ? `globals/${target.global}`
    : `${target.collection}/${data.id != null && data.id !== '' ? data.id : 0}`;
  try {
    const res = await fetch(`${window.location.origin}/api/${encodeURI(endpoint)}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Payload-HTTP-Method-Override': 'GET' },
      body: JSON.stringify({ data, depth, flattenLocales: false, locale }),
    });
    if (!res.ok) return data;
    const json = await res.json();
    return json && typeof json === 'object' && !json.errors ? { ...json, id: json.id ?? data.id } : data;
  } catch {
    return data;
  }
}

/** Écoute les messages de l'admin pour une cible ; renvoie la dernière version peuplée. */
function useLiveMessages(
  match: (msg: LiveMessage) => boolean,
  target: { collection?: string; global?: string },
  depth: number,
  onDoc: (doc: Doc, raw: boolean) => void,
) {
  const matchRef = useRef(match);
  const onDocRef = useRef(onDoc);
  matchRef.current = match;
  onDocRef.current = onDoc;
  const key = `${target.collection ?? ''}|${target.global ?? ''}|${depth}`;

  useEffect(() => {
    if (!isInIframe()) return;
    announceReady();
    let seq = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onMessage = (event: MessageEvent) => {
      if (!isLiveMessage(event)) return;
      const msg = event.data;
      if (!msg.data || !matchRef.current(msg)) return;
      // Valeurs brutes tout de suite (le texte suit la frappe), puis version peuplée.
      onDocRef.current(msg.data, true);
      const mine = ++seq;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const doc = await populate(target, msg.data as Doc, depth, msg.locale);
        if (mine === seq) onDocRef.current(doc, false);
      }, 250);
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

const isPlainObject = (v: unknown): v is Record<string, any> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Fusionne une nouvelle version dans la précédente sans perdre ce qui était
 * déjà peuplé :
 * - une relation brute (identifiant) garde l'objet peuplé de même identifiant
 *   (la photo ne clignote pas à chaque frappe) ;
 * - les groupes et les lignes de listes sont fusionnés récursivement ;
 * - `raw` (valeurs du formulaire, avant peuplement) : un champ liste vide y
 *   vaut le nombre 0 (compteur de lignes de Payload) ; on garde la valeur
 *   précédente plutôt que de passer un nombre à la page.
 */
function keepPopulated<T>(prev: T, next: unknown, raw = false): T {
  if (Array.isArray(next)) {
    if (!Array.isArray(prev)) return next as T;
    return next.map((item, i) => keepPopulated(prev[i], item, raw)) as T;
  }
  if (isPlainObject(next)) {
    if (!isPlainObject(prev)) return next as T;
    const out: Record<string, any> = { ...prev };
    for (const [k, v] of Object.entries(next)) out[k] = keepPopulated(prev[k], v, raw);
    return out as T;
  }
  if (typeof next === 'number' || typeof next === 'string') {
    if (isPlainObject(prev) && 'id' in prev && prev.id == next) return prev;
    if (raw && typeof next === 'number' && (Array.isArray(prev) || prev == null)) return prev;
  }
  return next as T;
}

export function useLiveGlobal<T extends Doc | null | undefined>(slug: string, initial: T, depth = 1): T {
  const [doc, setDoc] = useState<T>(initial);
  useEffect(() => setDoc(initial), [initial]);
  useLiveMessages(
    (msg) => msg.globalSlug === slug,
    { global: slug },
    depth,
    (next, raw) => setDoc((prev) => keepPopulated((prev ?? {}) as Doc, next, raw) as T),
  );
  return doc;
}

export function useLiveDoc<T extends Doc>(collection: string, initial: T, depth = 1): T {
  const [doc, setDoc] = useState<T>(initial);
  useEffect(() => setDoc(initial), [initial]);
  useLiveMessages(
    (msg) => msg.collectionSlug === collection && (initial?.id == null || msg.data?.id == initial.id),
    { collection },
    depth,
    (next, raw) => setDoc((prev) => keepPopulated(prev, next, raw)),
  );
  return doc;
}

/**
 * Liste d'une collection : l'élément modifié remplace celui de même
 * identifiant. `accept` peut écarter un élément qui ne doit plus figurer dans
 * la liste (ex. concert passé) ; `transform` convertit la fiche brute au
 * format affiché par la page.
 */
export function useLiveList<T extends Doc>(
  collection: string,
  items: T[],
  options: { depth?: number; transform?: (doc: Doc) => T | null; appendNew?: boolean } = {},
): T[] {
  const { depth = 1, transform, appendNew = true } = options;
  const [list, setList] = useState<T[]>(items);
  useEffect(() => setList(items), [items]);
  const transformRef = useRef(transform);
  transformRef.current = transform;
  // Dernière fiche brute peuplée, par identifiant (évite de perdre les photos
  // entre deux frappes quand la page affiche une version transformée).
  const rawCache = useRef(new Map<string, Doc>());

  useLiveMessages(
    (msg) => msg.collectionSlug === collection,
    { collection },
    depth,
    (incoming, isRaw) => {
      const raw = incoming;
      setList((prev) => {
        const index = prev.findIndex((item) => item.id != null && item.id == raw.id);
        const cacheKey = String(raw.id ?? 'new');
        const base = rawCache.current.get(cacheKey) ?? (!transformRef.current && index >= 0 ? prev[index] : {});
        const merged = keepPopulated(base as Doc, raw, isRaw);
        rawCache.current.set(cacheKey, merged);
        const next = transformRef.current ? transformRef.current(merged) : (merged as T);
        if (index >= 0) {
          const copy = prev.slice();
          if (next) copy[index] = next;
          else copy.splice(index, 1);
          return copy;
        }
        return next && appendNew ? [...prev, next] : prev;
      });
    },
  );
  return list;
}
