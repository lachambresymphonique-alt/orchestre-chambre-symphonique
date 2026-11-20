/**
 * Qui a droit à l'espace membres de ce site : le bureau et la direction artistique.
 *
 * Décision du 2026-11-20 : musiciens et équipe technique auront leur espace
 * dans Orchestra manager. Les comptes existants ne sont pas supprimés ; ils
 * cessent simplement d'ouvrir une session. Seule source de cette règle :
 * session, demande de lien, connexion, invitation et inscriptions la lisent ici.
 * Rouvrir à une section = l'ajouter à MEMBER_AREA_SECTIONS.
 */
import { PUPITRE_SECTIONS, type SectionValue } from './musicianForm';

export const MEMBER_AREA_SECTIONS: readonly SectionValue[] = ['bureau', 'direction'];

export const MEMBER_AREA_RESERVED = 'L’espace membres de ce site est réservé au bureau et à la direction artistique.';

/** Vrai si une fiche de cette section peut se connecter à l'espace membres. */
export function memberAreaAllows(section: unknown): boolean {
  return typeof section === 'string' && (MEMBER_AREA_SECTIONS as readonly string[]).includes(section);
}

/** Section de la fiche liée à un compte (fiche chargée ou simple identifiant). */
export function accountSection(musician: unknown): string | null {
  return musician && typeof musician === 'object' ? ((musician as { section?: string | null }).section ?? null) : null;
}

/**
 * Vrai si un lien d'inscription de ce rôle peut encore servir : les rôles
 * actuels (musiciens, équipe technique) ne mènent à aucune section admise.
 */
export function joinRoleAllowed(role: unknown): boolean {
  const sections: readonly string[] = role === 'technique' ? ['technique'] : role === 'musicien' ? PUPITRE_SECTIONS : [];
  return sections.some(memberAreaAllows);
}
