/**
 * Autres projets d'un musicien (ensemble, duo, album…) : un nom et, s'il en a,
 * un site, une chaîne YouTube et un compte Instagram.
 *
 * Seule source des règles de saisie : l'admin, « Ma fiche » de l'espace
 * membres, le formulaire de recrutement et la page publique passent par ici.
 * Chargé par l'admin comme par le site : ne dépend que de ./links.
 */
import { normalizeUrl } from './links';

export type Project = { name: string; websiteUrl: string; youtubeUrl: string; instagram: string };

export const EMPTY_PROJECT: Project = { name: '', websiteUrl: '', youtubeUrl: '', instagram: '' };
export const MAX_PROJECTS = 10;
export const PROJECT_NAME_MAX = 120;
const LINK_MAX = 300;

/** Adresse de la chaîne YouTube (« @machaine » accepté), ou '' si ce n'en est pas une. */
export function normalizeYoutube(input: unknown): string {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (/^@[\w.-]{3,30}$/.test(raw)) return `https://www.youtube.com/${raw}`;
  const url = normalizeUrl(raw);
  if (!url) return '';
  const host = new URL(url).hostname.toLowerCase();
  return /(^|\.)youtube\.com$/.test(host) || host === 'youtu.be' ? url : '';
}

/** Compte Instagram sous la forme « @compte » (adresse du profil acceptée), ou ''. */
export function normalizeInstagramHandle(input: unknown): string {
  const raw = typeof input === 'string' ? input.trim() : '';
  const handle = raw
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^(www\.)?instagram\.com\//i, '')
    .replace(/[/?#].*$/, '')
    .replace(/^@/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? `@${handle}` : '';
}

export function instagramUrl(handle: string): string {
  const clean = normalizeInstagramHandle(handle);
  return clean ? `https://www.instagram.com/${clean.slice(1)}/` : '';
}

const str = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/**
 * Projets tels qu'enregistrés → projets affichables : sans nom, un projet est
 * écarté ; un lien douteux est vidé plutôt qu'affiché.
 */
export function projectList(rows: unknown): Project[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const r = (row ?? {}) as Record<string, unknown>;
      return {
        name: str(r.name),
        websiteUrl: normalizeUrl(r.websiteUrl),
        youtubeUrl: normalizeYoutube(r.youtubeUrl),
        instagram: normalizeInstagramHandle(r.instagram),
      };
    })
    .filter((project) => project.name);
}

/** Projets → texte comparable et enregistrable ('' quand il n'y en a pas). */
export function projectsToText(rows: unknown): string {
  const projects = projectList(rows);
  return projects.length > 0 ? JSON.stringify(projects) : '';
}

export function projectsFromText(text: unknown): Project[] {
  if (typeof text !== 'string' || !text.trim()) return [];
  try {
    return projectList(JSON.parse(text));
  } catch {
    return [];
  }
}

/** Projets → lignes de la fiche (champ vide = null). */
export function projectRows(projects: Project[]) {
  return projects.map((p) => ({
    name: p.name,
    websiteUrl: p.websiteUrl || null,
    youtubeUrl: p.youtubeUrl || null,
    instagram: p.instagram || null,
  }));
}

/** Une ligne par projet, pour un e-mail : « Nom — site — YouTube — Instagram ». */
export function projectsSummary(projects: Project[]): string {
  return projects.map((p) => [p.name, p.websiteUrl, p.youtubeUrl, p.instagram].filter(Boolean).join(' — ')).join('\n');
}

/**
 * Saisie d'un formulaire (texte JSON ou tableau) contrôlée projet par projet.
 * Une ligne entièrement vide est ignorée ; `error` décrit la première erreur.
 */
export function readProjects(raw: unknown): { projects: Project[]; error: string | null } {
  let rows: unknown = raw;
  if (typeof raw === 'string') {
    if (!raw.trim()) return { projects: [], error: null };
    try {
      rows = JSON.parse(raw);
    } catch {
      return { projects: [], error: 'Projets : saisie illisible, rechargez la page et recommencez.' };
    }
  }
  if (!Array.isArray(rows)) return { projects: [], error: null };

  const projects: Project[] = [];
  for (const row of rows) {
    const r = (row ?? {}) as Record<string, unknown>;
    const typed = { name: str(r.name), websiteUrl: str(r.websiteUrl), youtubeUrl: str(r.youtubeUrl), instagram: str(r.instagram) };
    if (!typed.name && !typed.websiteUrl && !typed.youtubeUrl && !typed.instagram) continue;
    const position = projects.length + 1;
    if (!typed.name) return { projects, error: `Projet n° ${position} : donnez-lui un nom.` };
    const label = `Projet « ${typed.name.slice(0, 60)} »`;
    if (typed.name.length > PROJECT_NAME_MAX) return { projects, error: `${label} : ${PROJECT_NAME_MAX} caractères au plus pour le nom.` };
    if ([typed.websiteUrl, typed.youtubeUrl, typed.instagram].some((v) => v.length > LINK_MAX)) {
      return { projects, error: `${label} : un des liens est trop long.` };
    }
    const project: Project = {
      name: typed.name,
      websiteUrl: normalizeUrl(typed.websiteUrl),
      youtubeUrl: normalizeYoutube(typed.youtubeUrl),
      instagram: normalizeInstagramHandle(typed.instagram),
    };
    if (typed.websiteUrl && !project.websiteUrl) return { projects, error: `${label} : le site n’est pas une adresse web (exemple : www.monprojet.fr).` };
    if (typed.youtubeUrl && !project.youtubeUrl) return { projects, error: `${label} : indiquez l’adresse de la chaîne YouTube (exemple : youtube.com/@machaine).` };
    if (typed.instagram && !project.instagram) return { projects, error: `${label} : indiquez le compte Instagram (exemple : @moncompte).` };
    projects.push(project);
  }
  if (projects.length > MAX_PROJECTS) return { projects, error: `${MAX_PROJECTS} projets au plus.` };
  return { projects, error: null };
}
