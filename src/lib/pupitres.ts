import type { SectionValue } from './musicianForm';

/**
 * Pupitres de l'orchestre et destinataires des documents de l'espace membres
 * (partitions, fiches techniques…). Seule source de ces listes : le champ
 * « Pupitres » des fiches musiciens, le champ « Destinataires » des documents
 * et la règle de visibilité ci-dessous les lisent ici.
 *
 * Le pupitre est plus fin que la section de la fiche (« Cordes » ne dit pas
 * « Violons 2 ») ; il est renseigné par l'équipe, jamais par le membre.
 *
 * Attention, ce n'est pas un doublon : ailleurs dans le projet, « pupitre »
 * désigne les familles d'instruments (cordes, vents, claviers) — la question
 * « Pupitres proposés » du formulaire de recrutement et `PUPITRE_SECTIONS`
 * dans musicianForm.ts, tirées des sections de la page Musiciens. Ici, ce
 * sont les pupitres d'orchestre (Violons 1, Violons 2, Altos…), qui servent
 * seulement à adresser les partitions.
 *
 * Les groupes « technique » et « bureau » correspondent aux sections du même
 * nom des fiches musiciens.
 */

/**
 * `section` : section de la fiche musicien où ranger une nouvelle recrue de ce
 * pupitre, typée par les sections de musicianForm (une section renommée ou
 * retirée devient une erreur de compilation) ; `role` : rôle proposé sur sa fiche. Deux suggestions pour l'équipe,
 * modifiables à la validation d'une demande d'accès.
 */
export const PUPITRES = [
  { value: 'violons-1', label: 'Violons 1', section: 'cordes', role: 'Violoniste' },
  { value: 'violons-2', label: 'Violons 2', section: 'cordes', role: 'Violoniste' },
  { value: 'altos', label: 'Altos', section: 'cordes', role: 'Altiste' },
  { value: 'violoncelles', label: 'Violoncelles', section: 'cordes', role: 'Violoncelliste' },
  { value: 'contrebasses', label: 'Contrebasses', section: 'cordes', role: 'Contrebassiste' },
  { value: 'flutes', label: 'Flûtes', section: 'vents', role: 'Flûtiste' },
  { value: 'hautbois', label: 'Hautbois', section: 'vents', role: 'Hautboïste' },
  { value: 'clarinettes', label: 'Clarinettes', section: 'vents', role: 'Clarinettiste' },
  { value: 'bassons', label: 'Bassons', section: 'vents', role: 'Bassoniste' },
  { value: 'cors', label: 'Cors', section: 'vents', role: 'Corniste' },
  { value: 'trompettes', label: 'Trompettes', section: 'vents', role: 'Trompettiste' },
  { value: 'trombones', label: 'Trombones', section: 'vents', role: 'Tromboniste' },
  { value: 'tuba', label: 'Tuba', section: 'vents', role: 'Tubiste' },
  { value: 'timbales', label: 'Timbales', section: 'claviers', role: 'Timbalier' },
  { value: 'percussions', label: 'Percussions', section: 'claviers', role: 'Percussionniste' },
  { value: 'harpe', label: 'Harpe', section: 'claviers', role: 'Harpiste' },
  { value: 'claviers', label: 'Piano et claviers', section: 'claviers', role: 'Pianiste' },
] as const satisfies readonly { value: string; label: string; section: SectionValue; role: string }[];

/** Destinataires qui ne sont pas des pupitres. */
export const AUDIENCE_GROUPS = [
  { value: 'tous', label: 'Tous les membres' },
  { value: 'technique', label: 'Équipe technique' },
  { value: 'bureau', label: 'Bureau' },
] as const;

export const RECIPIENT_OPTIONS = [...AUDIENCE_GROUPS, ...PUPITRES];

const LABELS: Record<string, string> = Object.fromEntries(RECIPIENT_OPTIONS.map((o) => [o.value, o.label]));

export function recipientLabel(value: string): string {
  return LABELS[value] ?? value;
}

/** Sections de la fiche musicien qui ouvrent un groupe de destinataires. */
const GROUP_BY_SECTION: Record<string, string> = { technique: 'technique', bureau: 'bureau' };

/**
 * Un membre voit un document adressé à tous, à l'un de ses pupitres, ou au
 * groupe de sa section (équipe technique, bureau). La direction artistique
 * voit tout : c'est elle qui dirige avec le conducteur.
 */
export function canSeeDocument(
  member: { section?: string | null; pupitres?: string[] | null },
  recipients: string[] | null | undefined,
): boolean {
  const list = recipients ?? [];
  if (member.section === 'direction') return true;
  if (list.includes('tous')) return true;
  const group = member.section ? GROUP_BY_SECTION[member.section] : undefined;
  if (group && list.includes(group)) return true;
  return (member.pupitres ?? []).some((p) => list.includes(p));
}

/** Délai après la dernière représentation au-delà duquel un document de concert disparaît. */
export const DOCUMENT_GRACE_DAYS = 15;

/**
 * Date à partir de laquelle un document n'est plus proposé aux membres :
 * la date saisie par l'équipe, sinon 15 jours après la dernière
 * représentation du concert lié, sinon jamais (null).
 */
export function documentExpiry(doc: {
  visibleUntil?: string | null;
  concert?: { lastDate?: string | null; date?: string | null } | number | string | null;
}): Date | null {
  if (doc.visibleUntil) {
    const until = new Date(doc.visibleUntil);
    until.setHours(23, 59, 59, 999);
    return until;
  }
  const concert = doc.concert && typeof doc.concert === 'object' ? doc.concert : null;
  const last = concert?.lastDate || concert?.date;
  if (!last) return null;
  const expiry = new Date(last);
  expiry.setDate(expiry.getDate() + DOCUMENT_GRACE_DAYS);
  expiry.setHours(23, 59, 59, 999);
  return expiry;
}

/** Pupitre d'orchestre par sa valeur (undefined si inconnu). */
export function findPupitre(value: string | null | undefined) {
  return PUPITRES.find((p) => p.value === value);
}

/**
 * Rôles des liens d'inscription que l'équipe partage dans ses discussions
 * (collection member-invite-links). Une demande reçue par un lien « Musiciens »
 * indique son pupitre ; une demande « Équipe technique », non.
 */
export const JOIN_ROLES = [
  { value: 'musicien', label: 'Musiciens' },
  { value: 'technique', label: 'Équipe technique' },
] as const;

export type JoinRole = (typeof JOIN_ROLES)[number]['value'];

export function joinRoleLabel(value: string | null | undefined): string {
  return JOIN_ROLES.find((r) => r.value === value)?.label ?? '';
}
