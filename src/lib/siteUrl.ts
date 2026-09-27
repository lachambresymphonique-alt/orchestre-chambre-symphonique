/**
 * Adresse publique du site.
 *
 * Elle est écrite ici plutôt que lue dans l'environnement : `NEXT_PUBLIC_SITE_URL`
 * n'est volontairement pas définie sur Vercel, pour que l'aperçu en direct de
 * l'admin utilise des adresses relatives et reste sur le domaine où il est
 * ouvert. Un lien destiné à être envoyé à quelqu'un, lui, ne peut pas dépendre
 * de l'endroit d'où on le fabrique : ouvert depuis un déploiement de
 * prévisualisation (`…vercel.app`), `window.location.origin` donne une adresse
 * qui n'est pas le site, et qui sert une version figée des pages.
 *
 * Si la variable est un jour renseignée, elle l'emporte.
 */
const FALLBACK_SITE_URL = 'https://www.lachambresymphonique.fr';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '')
  || FALLBACK_SITE_URL;

/** Adresse complète d'une page du site, à partir de son chemin (« /musiciens »). */
export function publicUrl(path: string): string {
  return `${SITE_URL}/${String(path ?? '').replace(/^\/+/, '')}`.replace(/\/$/, '') || SITE_URL;
}
