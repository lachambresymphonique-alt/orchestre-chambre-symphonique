/**
 * Synchronise le schéma Payload (tables, colonnes, index) sur la base pointée
 * par DATABASE_URL, via le « push » Drizzle de l’adaptateur Postgres.
 *
 * Vercel ne le fait jamais en production : après avoir ajouté une collection
 * ou un champ, lancez ce script une fois en local, puis déployez.
 *
 *   node --require ./src/patch-next-env.cjs --import tsx src/scripts/push-schema.ts
 *
 * Ajouter des tables ou des colonnes optionnelles est silencieux. Supprimer
 * une colonne ou ajouter une colonne obligatoire sur une table non vide
 * déclenche une question interactive de Drizzle : lancez alors le script
 * dans un vrai terminal (pas en tâche de fond).
 *
 * Ne pas lancer ce script pendant qu'un `next dev` de ce projet tourne : le
 * serveur de dev re-pousse déjà le schéma à chaque changement de config, et
 * deux pushes simultanés font échouer Drizzle (« relation already exists »).
 * Pour un autre script (seed, migration) lancé à côté d'un serveur de dev,
 * exporter PAYLOAD_MIGRATING=true désactive le push à l'initialisation.
 */
import { getPayload } from 'payload';
import config from '../payload.config';

async function main() {
  const started = Date.now();
  const payload = await getPayload({ config });
  const tables = Object.keys(((payload.db as any).tables ?? {}) as Record<string, unknown>).sort();

  console.log(`Schéma synchronisé en ${Math.round((Date.now() - started) / 100) / 10}s — ${tables.length} tables :`);
  for (const t of tables) console.log(`  · ${t}`);

  await (payload.db as any).destroy?.();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
