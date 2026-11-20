/**
 * Règles de retouche du formulaire musiciens appliquées par
 * update-musician-form-questions.ts, à part pour être testées sans base.
 */
import { FIELD_CATALOGUE } from '../lib/musicianForm';

export type Question = Record<string, unknown> & { field?: string; label?: string; hint?: string | null; placeholder?: string | null };
export type Part = Record<string, unknown> & { title?: string; questions?: Question[] };

const projectsEntry = FIELD_CATALOGUE.find((entry) => entry.key === 'projects');

/** Question retouchée, ou la même si rien ne la concerne. */
export function retouch(question: Question): Question {
  const next = { ...question };
  if (next.field === 'projectLinks' && projectsEntry) {
    next.field = 'projects';
    next.hint = projectsEntry.hint;
    next.placeholder = null;
  }
  if (next.field === 'desertIslandPiece' && typeof next.label === 'string') {
    next.label = next.label.replace(/emm[eè]nerais sur/, 'emmènerais-tu sur');
  }
  if (next.field === 'projects' && typeof next.label === 'string') {
    next.label = next.label.replace(/\s*\(site, insta, facebook\)\s*\?\s*$/i, ' (site, YouTube, Instagram)');
  }
  if (next.field === 'websiteUrl' && typeof next.hint === 'string' && next.hint.trim() === 'Une ligne par site internet') {
    next.hint = null;
  }
  return next;
}
