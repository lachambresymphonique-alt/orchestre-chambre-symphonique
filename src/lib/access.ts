import type { Access, CollectionConfig, GlobalConfig, PayloadRequest, SanitizedConfig } from 'payload';

/**
 * Droits d'accès : seuls les comptes de la collection `users` administrent.
 *
 * Sans règle, Payload autorise toute opération à n'importe quel compte
 * connecté (`Boolean(req.user)`). Tant que seuls des administrateurs ont un
 * compte, cela revient au même ; mais le jour où un autre type de compte
 * existe (espace membres), ce défaut lui ouvrirait l'admin, les messages
 * reçus et l'API REST/GraphQL de tout le site. On pose donc « administrateurs
 * seulement » sur toute opération qu'une collection ou un global ne règle pas
 * lui-même (voir payload.config.ts), et les règles explicites utilisent
 * `isAdmin` plutôt que `!!req.user`.
 *
 * Invariant contrôlé par src/scripts/check-access.ts : un compte connecté qui
 * n'est pas administrateur n'a jamais plus de droits qu'un visiteur anonyme.
 */

/** Collection des comptes administrateurs (`admin.user` de la config). */
const ADMIN_COLLECTION = 'users';

/** Vrai si `user` (req.user, ou résultat de payload.auth) est un administrateur. */
export function isAdminUser(user: unknown): boolean {
  return (
    typeof user === 'object' &&
    user !== null &&
    (user as { collection?: unknown }).collection === ADMIN_COLLECTION
  );
}

/** Règle d'accès Payload : administrateurs seulement. */
export const isAdmin = ({ req }: { req: PayloadRequest }): boolean => isAdminUser(req.user);

// Payload pose `unlock` sur toutes les collections, pas seulement les comptes.
const COLLECTION_OPERATIONS = ['create', 'read', 'update', 'delete', 'readVersions', 'unlock'];
/** Accès au panneau d'administration, propre aux collections de comptes. */
const AUTH_OPERATIONS = ['admin'];
const GLOBAL_OPERATIONS = ['read', 'update', 'readVersions'];

function withDefault<T extends { access?: object }>(config: T, operations: string[]): T {
  const access: Record<string, unknown> = { ...config.access };
  for (const operation of operations) access[operation] ??= isAdmin;
  return { ...config, access };
}

/** Réserve aux administrateurs les opérations qu'une collection ne règle pas elle-même. */
export function adminByDefault(collection: CollectionConfig): CollectionConfig {
  return withDefault(
    collection,
    collection.auth ? [...COLLECTION_OPERATIONS, ...AUTH_OPERATIONS] : COLLECTION_OPERATIONS,
  );
}

/** Réserve aux administrateurs les opérations qu'un global ne règle pas lui-même. */
export function globalAdminByDefault(global: GlobalConfig): GlobalConfig {
  return withDefault(global, GLOBAL_OPERATIONS);
}

/**
 * Collections que Payload ajoute lui-même à la validation de la config
 * (préférences, verrous d'édition, migrations…) : elles échappent à
 * `adminByDefault` et restent ouvertes à tout compte connecté. On garde
 * leurs règles pour les administrateurs — une préférence reste propre à
 * chacun — et on les refuse à tout autre compte.
 */
export function lockPayloadInternals(config: SanitizedConfig): SanitizedConfig {
  for (const collection of config.collections) {
    if (!collection.slug.startsWith('payload-')) continue;
    const access = collection.access as Record<string, Access | undefined>;
    for (const [operation, rule] of Object.entries(access)) {
      if (typeof rule !== 'function') continue;
      access[operation] = (args) => (isAdminUser(args.req.user) ? rule(args) : false);
    }
  }
  return config;
}
