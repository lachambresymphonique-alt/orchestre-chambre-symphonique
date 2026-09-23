import type { Config, Plugin } from 'payload';

/**
 * Ajoute l'indicateur « Modifications non enregistrées » (et son bouton
 * « Annuler les modifications ») à l'écran d'édition de chaque collection et
 * de chaque page globale, à gauche de « Sauvegarder ».
 * Voir `src/components/admin/UnsavedChanges.tsx`.
 */
const COMPONENT = '@/components/admin/UnsavedChanges#UnsavedChanges';

type WithEdit = {
  admin?: { components?: { elements?: { beforeDocumentControls?: unknown[] }; edit?: { beforeDocumentControls?: unknown[] } } };
};

function addTo<T extends WithEdit>(entity: T, key: 'edit' | 'elements'): T {
  const admin = entity.admin ?? {};
  const components = admin.components ?? {};
  const slot = (components as Record<string, { beforeDocumentControls?: unknown[] } | undefined>)[key] ?? {};
  const existing = slot.beforeDocumentControls ?? [];
  if (existing.includes(COMPONENT)) return entity;
  return {
    ...entity,
    admin: {
      ...admin,
      components: {
        ...components,
        [key]: { ...slot, beforeDocumentControls: [COMPONENT, ...existing] },
      },
    },
  };
}

export const unsavedChangesPlugin: Plugin = (config: Config): Config => ({
  ...config,
  collections: (config.collections ?? []).map((c) => addTo(c as WithEdit, 'edit') as typeof c),
  globals: (config.globals ?? []).map((g) => addTo(g as WithEdit, 'elements') as typeof g),
});
