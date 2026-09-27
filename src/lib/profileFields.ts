/**
 * Champs de la fiche musicien qu'un membre peut proposer de modifier depuis
 * l'espace membres. Seule source de cette liste : le formulaire, la route
 * d'envoi (/api/membres/fiche), la collection profile-changes et l'écran de
 * validation de l'admin la lisent ici.
 *
 * Hors liste, donc réservés à l'équipe : rôle, instrument, section, ordre
 * d'affichage et adresse de la fiche (changer l'adresse casserait les liens
 * et le référencement).
 */

export type ProfileFieldKind = 'text' | 'longtext' | 'lines' | 'url' | 'photo';

export type ProfileField = {
  name: ProfileFieldName;
  label: string;
  kind: ProfileFieldKind;
  /** Longueur maximale d'une valeur (par ligne pour `lines`). */
  max: number;
  help?: string;
};

export const PROFILE_FIELD_NAMES = [
  'name',
  'photo',
  'tagline',
  'instagram',
  'bio',
  'inspiringSymphony',
  'favoriteWork',
  'favoriteComposer',
  'formation',
  'concours',
  'videoUrl',
  'quote',
] as const;

export type ProfileFieldName = (typeof PROFILE_FIELD_NAMES)[number];

export const PROFILE_FIELDS: ProfileField[] = [
  { name: 'name', label: 'Nom complet', kind: 'text', max: 120 },
  { name: 'photo', label: 'Photo', kind: 'photo', max: 0, help: 'JPG, PNG ou WebP, 4 Mo au plus. Un portrait vertical rend le mieux.' },
  { name: 'tagline', label: 'Phrase signature', kind: 'text', max: 200, help: 'Une phrase courte qui vous résume.' },
  { name: 'instagram', label: 'Instagram', kind: 'text', max: 120, help: 'Votre identifiant, par exemple @nom_du_compte.' },
  {
    name: 'bio',
    label: 'Biographie',
    kind: 'longtext',
    max: 10_000,
    help: 'Formation, parcours, répertoire. Une ligne vide sépare deux paragraphes ; *italique*, **gras**.',
  },
  { name: 'inspiringSymphony', label: 'La symphonie qui vous a donné envie de faire de la musique', kind: 'text', max: 200 },
  { name: 'favoriteWork', label: 'Œuvre préférée', kind: 'text', max: 200 },
  { name: 'favoriteComposer', label: 'Compositeur préféré', kind: 'text', max: 200 },
  { name: 'formation', label: 'Formation', kind: 'lines', max: 300, help: 'Établissements, diplômes, master classes : une entrée par ligne.' },
  { name: 'concours', label: 'Concours et distinctions', kind: 'lines', max: 300, help: 'Prix, finales, récompenses : une entrée par ligne.' },
  { name: 'videoUrl', label: 'Vidéo', kind: 'url', max: 300, help: 'Lien YouTube ou Vimeo.' },
  { name: 'quote', label: 'Citation', kind: 'longtext', max: 1_000, help: 'Une phrase ou deux de vous.' },
];

export const PROFILE_FIELD_BY_NAME = Object.fromEntries(PROFILE_FIELDS.map((f) => [f.name, f])) as Record<
  ProfileFieldName,
  ProfileField
>;

/** Au-delà, une liste (formation, concours) est tronquée. */
export const MAX_LINES = 40;

type Lines = { item?: string | null }[] | null | undefined;

function relationId(value: unknown): string {
  if (value && typeof value === 'object' && 'id' in value) return String((value as { id: unknown }).id);
  return value == null || value === '' ? '' : String(value);
}

/**
 * Valeur d'un champ réduite à une chaîne comparable : c'est ce qu'on compare
 * pour savoir ce qui a changé, et ce qu'on affiche dans l'écran de validation.
 * Liste → une entrée par ligne ; photo → identifiant du média.
 */
export function comparable(field: ProfileFieldName, value: unknown): string {
  const kind = PROFILE_FIELD_BY_NAME[field].kind;
  if (kind === 'photo') return relationId(value);
  if (kind === 'lines') {
    return ((value as Lines) ?? [])
      .map((row) => (row?.item ?? '').trim())
      .filter(Boolean)
      .join('\n');
  }
  return typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim() : '';
}

/** Valeur comparable → valeur à écrire dans la fiche musicien. */
export function toMusicianValue(field: ProfileFieldName, value: string): unknown {
  const kind = PROFILE_FIELD_BY_NAME[field].kind;
  if (kind === 'lines') return value ? value.split('\n').map((item) => ({ item })) : [];
  if (kind === 'photo') return value ? Number(value) || value : null;
  return value || null;
}

/** Identifiant Instagram sous la forme @compte (même règle que le formulaire de recrutement). */
export function normalizeInstagram(value: string): string {
  if (!value) return '';
  return value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '@')
    .replace(/\/+$/, '')
    .replace(/^([^@])/, '@$1');
}
