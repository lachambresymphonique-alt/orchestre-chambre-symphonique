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

export const PUPITRES = [
  { value: 'violons-1', label: 'Violons 1' },
  { value: 'violons-2', label: 'Violons 2' },
  { value: 'altos', label: 'Altos' },
  { value: 'violoncelles', label: 'Violoncelles' },
  { value: 'contrebasses', label: 'Contrebasses' },
  { value: 'flutes', label: 'Flûtes' },
  { value: 'hautbois', label: 'Hautbois' },
  { value: 'clarinettes', label: 'Clarinettes' },
  { value: 'bassons', label: 'Bassons' },
  { value: 'cors', label: 'Cors' },
  { value: 'trompettes', label: 'Trompettes' },
  { value: 'trombones', label: 'Trombones' },
  { value: 'tuba', label: 'Tuba' },
  { value: 'timbales', label: 'Timbales' },
  { value: 'percussions', label: 'Percussions' },
  { value: 'harpe', label: 'Harpe' },
  { value: 'claviers', label: 'Piano et claviers' },
] as const;

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
