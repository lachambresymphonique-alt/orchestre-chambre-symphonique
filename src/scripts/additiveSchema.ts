/**
 * Applique à la base une liste d'ajouts (colonnes, tables, valeurs de liste)
 * sans passer par le « push » Drizzle — bloqué depuis le code en ligne tant que
 * la base garde des tables d'un travail non publié (pupitres modifiables).
 *
 * Les instructions à donner sont celles que Drizzle génère lui-même
 * (generateMigration entre le schéma en ligne et le nouveau), rendues
 * rejouables (IF NOT EXISTS) : un push ultérieur ne trouve rien à refaire.
 * Avec --dry-run, elles sont affichées sans aucune connexion à la base.
 */
import { Client } from 'pg';

export type AdditiveSchema = {
  /** `ALTER TYPE … ADD VALUE IF NOT EXISTS …` : hors transaction, une valeur se pose seule. */
  enumValues: string[];
  /** Tables, colonnes, clés, index : dans une seule transaction, tout passe ou rien. */
  statements: string[];
  /** Ce que le code attend après coup : table → colonnes. */
  expected: Record<string, string[]>;
  /** Message affiché quand tout est en place. */
  done: string;
};

/** Clé étrangère posée une seule fois (Postgres n'a pas de « ADD CONSTRAINT IF NOT EXISTS »). */
export const parentForeignKey = (table: string, parent: string) => `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${table}_parent_id_fk') THEN
    ALTER TABLE "${table}" ADD CONSTRAINT "${table}_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."${parent}"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$`;

async function apply({ enumValues, statements, expected, done }: AdditiveSchema) {
  if (process.argv.includes('--dry-run')) {
    console.log([...enumValues, ...statements].join(';\n\n') + ';');
    return;
  }

  // Même connexion que payload.config.ts : « sslmode » retiré, SSL réglé à la main.
  const raw = process.env.DATABASE_URL || '';
  if (!raw) throw new Error('DATABASE_URL absente : lancez le script depuis le dossier du site, avec .env.local.');
  const url = new URL(raw);
  url.searchParams.delete('sslmode');
  const client = new Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    for (const statement of enumValues) await client.query(statement);
    await client.query('BEGIN');
    try {
      for (const statement of statements) await client.query(statement);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

    const { rows } = await client.query(
      `select table_name, column_name from information_schema.columns where table_schema = 'public' and table_name = any($1)`,
      [Object.keys(expected)],
    );
    const present = new Set(rows.map((r) => `${r.table_name}.${r.column_name}`));
    const missing = Object.entries(expected).flatMap(([table, columns]) =>
      columns.filter((column) => !present.has(`${table}.${column}`)).map((column) => `${table}.${column}`),
    );
    if (missing.length > 0) throw new Error(`Colonnes toujours absentes : ${missing.join(', ')}`);
    console.log(done);
  } finally {
    await client.end();
  }
}

export function applyAdditiveSchema(schema: AdditiveSchema) {
  apply(schema).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
