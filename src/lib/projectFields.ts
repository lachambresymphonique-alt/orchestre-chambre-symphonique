/**
 * Champ « Autres projets » de l'admin, identique dans Musiciens, Fiches
 * musiciens reçues et Modifications proposées : une ligne par projet.
 * Les règles de saisie sont celles de lib/projects.ts.
 */
import type { Field } from 'payload';
import { normalizeUrl } from './links';
import { normalizeInstagramHandle, normalizeYoutube } from './projects';

type Normalize = (value: unknown) => string;

/** Complète la saisie à l'enregistrement (« https:// », « @ ») ; la refuse si elle n'a pas de sens. */
const link = (name: string, label: string, normalize: Normalize, example: string): Field => ({
  name,
  type: 'text',
  label,
  admin: { placeholder: example },
  hooks: {
    beforeValidate: [
      ({ value }) => (typeof value === 'string' && value.trim() ? normalize(value) || value.trim() : value),
    ],
  },
  validate: (value: unknown) =>
    typeof value !== 'string' || !value.trim() || normalize(value) ? true : `Saisie non reconnue. Exemple : ${example}`,
});

export function projectsField(admin: Record<string, unknown> = {}): Field {
  return {
    name: 'projects',
    type: 'array',
    label: 'Autres projets',
    labels: { singular: 'Projet', plural: 'Projets' },
    admin: {
      description: 'Ensemble, duo, album… Un projet a un nom et, s’il en a, un site, une chaîne YouTube et un compte Instagram.',
      ...admin,
    },
    fields: [
      { name: 'name', type: 'text', required: true, label: 'Nom du projet' },
      link('websiteUrl', 'Site internet', normalizeUrl, 'www.monprojet.fr'),
      link('youtubeUrl', 'Chaîne YouTube', normalizeYoutube, 'youtube.com/@machaine'),
      link('instagram', 'Instagram', normalizeInstagramHandle, '@moncompte'),
    ],
  };
}

/** Vrai tant que l'ancien champ (liens seuls) contient quelque chose : il ne s'affiche qu'alors. */
export const hasLegacyLinks = (data: Record<string, unknown> | undefined): boolean => {
  const value = data?.projectLinks;
  return Array.isArray(value) ? value.length > 0 : typeof value === 'string' && value.trim() !== '';
};

export const LEGACY_LINKS_NOTE =
  'Ancien format, liens sans nom. Recopiez-les dans « Autres projets » ci-dessus puis videz ce champ : il disparaîtra.';
