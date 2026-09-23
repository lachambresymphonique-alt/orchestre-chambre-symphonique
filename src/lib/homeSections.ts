/**
 * Sections de la page d'accueil et leur ordre.
 *
 * L'ordre se règle dans l'admin (Pages → Page d'accueil → « Sections de la
 * page ») et s'enregistre dans le champ JSON `sections` du global `home-page` :
 * `[{ key: 'concerts', hidden: false }, …]`. La bannière n'en fait pas partie :
 * elle porte le titre principal (h1) et reste toujours en haut.
 *
 * Module pur (aucune dépendance serveur) : lu par la page publique, par son
 * aperçu en direct et par l'éditeur de l'admin.
 */

export const HOME_SECTIONS = [
  {
    key: 'concerts',
    label: 'Concerts',
    hint: 'Le concert à la une, ses dates et la billetterie, puis les autres concerts.',
    /** Groupe de champs du global qui règle cette section (id `field-<group>`). */
    group: 'concerts',
  },
  {
    key: 'statement',
    label: 'Conviction',
    hint: 'Le manifeste en grandes lettres, avec une photo d’ambiance.',
    group: 'statement',
  },
  {
    key: 'bento',
    label: 'Rencontre',
    hint: 'Trois cartes : le chef, les musiciens, l’histoire.',
    group: 'bento',
  },
  {
    key: 'soloists',
    label: 'Solistes invités',
    hint: 'Les solistes choisis dans « À la une ». Sans soliste choisi, la section n’apparaît pas.',
    group: 'featured',
  },
  {
    key: 'presentation',
    label: 'Présentation',
    hint: 'Un texte long avec une photo.',
    group: 'presentation',
  },
  {
    key: 'partners',
    label: 'Partenaires',
    hint: 'Les logos des partenaires (Contenu → Partenaires). Sans partenaire, la section n’apparaît pas.',
    group: 'partners',
  },
  {
    key: 'newsletter',
    label: 'Newsletter',
    hint: 'L’inscription à la lettre d’information.',
    group: 'newsletter',
  },
] as const;

export type HomeSectionKey = (typeof HOME_SECTIONS)[number]['key'];
export type HomeSectionInfo = (typeof HOME_SECTIONS)[number];
export type HomeSectionEntry = { key: HomeSectionKey; hidden: boolean };

/** La bannière : toujours en haut, hors de la liste ordonnable. */
export const HOME_HERO = {
  label: 'Bannière',
  hint: 'Le grand titre et la photo. Toujours en haut de la page.',
  group: 'hero',
} as const;

const KEYS = HOME_SECTIONS.map((s) => s.key) as readonly HomeSectionKey[];

export function isHomeSectionKey(value: unknown): value is HomeSectionKey {
  return typeof value === 'string' && (KEYS as readonly string[]).includes(value);
}

export function homeSectionInfo(key: HomeSectionKey): HomeSectionInfo {
  return HOME_SECTIONS.find((s) => s.key === key) as HomeSectionInfo;
}

/** Ordre par défaut : les prochaines dates d'abord, puis la conviction. */
export const DEFAULT_HOME_SECTIONS: HomeSectionEntry[] = KEYS.map((key) => ({ key, hidden: false }));

/**
 * Ordre enregistré, nettoyé : entrées inconnues et doublons écartés, et toute
 * section absente (ajoutée au site après le dernier enregistrement) reprend
 * sa place par défaut, visible. Une valeur vide donne l'ordre par défaut.
 */
export function resolveHomeSections(value: unknown): HomeSectionEntry[] {
  const saved: HomeSectionEntry[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      const key = (item as { key?: unknown } | null)?.key;
      if (!isHomeSectionKey(key) || saved.some((s) => s.key === key)) continue;
      saved.push({ key, hidden: (item as { hidden?: unknown }).hidden === true });
    }
  }
  if (saved.length === 0) return DEFAULT_HOME_SECTIONS.map((s) => ({ ...s }));

  // Sections manquantes : insérées juste après la section qui les précède
  // dans l'ordre par défaut (ou en tête si aucune ne les précède).
  const result = [...saved];
  KEYS.forEach((key, i) => {
    if (result.some((s) => s.key === key)) return;
    const before = KEYS.slice(0, i).reverse().find((k) => result.some((s) => s.key === k));
    const at = before ? result.findIndex((s) => s.key === before) + 1 : 0;
    result.splice(at, 0, { key, hidden: false });
  });
  return result;
}

/** Validation Payload du champ `sections`. */
export function validateHomeSections(value: unknown): true | string {
  if (value === null || value === undefined || value === '') return true;
  if (!Array.isArray(value)) return 'L’ordre des sections est illisible : rechargez la page.';
  const seen = new Set<string>();
  for (const item of value) {
    const key = (item as { key?: unknown } | null)?.key;
    if (!isHomeSectionKey(key)) return 'Une section inconnue figure dans la liste : rechargez la page.';
    if (seen.has(key)) return `La section « ${homeSectionInfo(key).label} » figure deux fois.`;
    seen.add(key);
  }
  return true;
}
