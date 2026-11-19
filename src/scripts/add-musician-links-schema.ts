/**
 * Fiche musicien : site internet, crédit photo, liens vers d'autres projets.
 * Ajoute en base ce que ces champs demandent — et rien d'autre.
 *
 *   node --require ./src/patch-next-env.cjs --import tsx src/scripts/add-musician-links-schema.ts
 *   … --dry-run   affiche les instructions sans se connecter à la base
 *
 * Pourquoi pas le « push » habituel (src/scripts/push-schema.ts) : la base
 * contient des tables d'un travail non publié (pupitres modifiables). Depuis
 * le code en ligne, Drizzle demande alors s'il faut les renommer ou les
 * supprimer, et reste bloqué sur cette question.
 *
 * Les instructions ci-dessous sont celles que Drizzle génère lui-même pour ce
 * changement (generateMigration entre le schéma en ligne et celui-ci) : un
 * push ultérieur ne trouvera donc rien à refaire. Uniquement des ajouts ;
 * relancer le script ne change rien.
 */
import { Client } from 'pg';

/** Hors transaction : une valeur d'enum se pose seule. */
const ENUM_VALUES = [
  `ALTER TYPE "public"."enum_profile_changes_changed_fields" ADD VALUE IF NOT EXISTS 'photoCredit'`,
  `ALTER TYPE "public"."enum_profile_changes_changed_fields" ADD VALUE IF NOT EXISTS 'websiteUrl'`,
  `ALTER TYPE "public"."enum_profile_changes_changed_fields" ADD VALUE IF NOT EXISTS 'projectLinks'`,
  `ALTER TYPE "public"."enum_musician_form_parts_questions_field" ADD VALUE IF NOT EXISTS 'photoCredit'`,
  `ALTER TYPE "public"."enum_musician_form_parts_questions_field" ADD VALUE IF NOT EXISTS 'websiteUrl'`,
  `ALTER TYPE "public"."enum_musician_form_parts_questions_field" ADD VALUE IF NOT EXISTS 'projectLinks'`,
];

/** Clé étrangère posée une seule fois (Postgres n'a pas de « ADD CONSTRAINT IF NOT EXISTS »). */
const foreignKey = (table: string, parent: string) => `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${table}_parent_id_fk') THEN
    ALTER TABLE "${table}" ADD CONSTRAINT "${table}_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."${parent}"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$`;

/** Dans une seule transaction : tout passe, ou rien. */
const TABLES_AND_COLUMNS = [
  `CREATE TABLE IF NOT EXISTS "musicians_project_links" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"item" varchar NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS "profile_changes_project_links" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"item" varchar
)`,
  `ALTER TABLE "musicians" ADD COLUMN IF NOT EXISTS "photo_credit" varchar`,
  `ALTER TABLE "musicians" ADD COLUMN IF NOT EXISTS "website_url" varchar`,
  `ALTER TABLE "musician_submissions" ADD COLUMN IF NOT EXISTS "website_url" varchar`,
  `ALTER TABLE "musician_submissions" ADD COLUMN IF NOT EXISTS "project_links" varchar`,
  `ALTER TABLE "musician_submissions" ADD COLUMN IF NOT EXISTS "photo_credit" varchar`,
  `ALTER TABLE "profile_changes" ADD COLUMN IF NOT EXISTS "photo_credit" varchar`,
  `ALTER TABLE "profile_changes" ADD COLUMN IF NOT EXISTS "website_url" varchar`,
  foreignKey('musicians_project_links', 'musicians'),
  foreignKey('profile_changes_project_links', 'profile_changes'),
  `CREATE INDEX IF NOT EXISTS "musicians_project_links_order_idx" ON "musicians_project_links" USING btree ("_order")`,
  `CREATE INDEX IF NOT EXISTS "musicians_project_links_parent_id_idx" ON "musicians_project_links" USING btree ("_parent_id")`,
  `CREATE INDEX IF NOT EXISTS "profile_changes_project_links_order_idx" ON "profile_changes_project_links" USING btree ("_order")`,
  `CREATE INDEX IF NOT EXISTS "profile_changes_project_links_parent_id_idx" ON "profile_changes_project_links" USING btree ("_parent_id")`,
];

/** Ce que le code attend après coup : table → colonnes. */
const EXPECTED: Record<string, string[]> = {
  musicians: ['photo_credit', 'website_url'],
  musicians_project_links: ['_order', '_parent_id', 'id', 'item'],
  profile_changes: ['photo_credit', 'website_url'],
  profile_changes_project_links: ['_order', '_parent_id', 'id', 'item'],
  musician_submissions: ['photo_credit', 'website_url', 'project_links'],
};

async function main() {
  if (process.argv.includes('--dry-run')) {
    console.log([...ENUM_VALUES, ...TABLES_AND_COLUMNS].join(';\n\n') + ';');
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
    for (const statement of ENUM_VALUES) await client.query(statement);
    await client.query('BEGIN');
    try {
      for (const statement of TABLES_AND_COLUMNS) await client.query(statement);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

    const { rows } = await client.query(
      `select table_name, column_name from information_schema.columns where table_schema = 'public' and table_name = any($1)`,
      [Object.keys(EXPECTED)],
    );
    const present = new Set(rows.map((r) => `${r.table_name}.${r.column_name}`));
    const missing = Object.entries(EXPECTED).flatMap(([table, columns]) =>
      columns.filter((column) => !present.has(`${table}.${column}`)).map((column) => `${table}.${column}`),
    );
    if (missing.length > 0) throw new Error(`Colonnes toujours absentes : ${missing.join(', ')}`);
    console.log('Base à jour : site internet, crédit photo et autres projets sont en place.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
