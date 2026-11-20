/**
 * Fiche musicien : « Autres projets » repensés — un projet a un nom et, s'il en
 * a, un site, une chaîne YouTube et un compte Instagram. Ajoute en base ce que
 * ce champ demande, dans Musiciens, Fiches musiciens reçues et Modifications
 * proposées. Voir additiveSchema.ts.
 *
 *   node --require ./src/patch-next-env.cjs --import tsx src/scripts/add-musician-projects-schema.ts
 *   … --dry-run   affiche les instructions sans se connecter à la base
 *
 * L'ancien champ (liens sans nom) garde ses tables. Seul changement sur
 * l'existant : son lien devient facultatif en base (le champ ne s'affiche plus
 * que s'il est rempli, et Payload rend alors la colonne facultative).
 */
import { applyAdditiveSchema, parentForeignKey } from './additiveSchema';

const projectsTable = (table: string, nameRequired: boolean) => `CREATE TABLE IF NOT EXISTS "${table}" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar${nameRequired ? ' NOT NULL' : ''},
	"website_url" varchar,
	"youtube_url" varchar,
	"instagram" varchar
)`;

const indexes = (table: string) => [
  `CREATE INDEX IF NOT EXISTS "${table}_order_idx" ON "${table}" USING btree ("_order")`,
  `CREATE INDEX IF NOT EXISTS "${table}_parent_id_idx" ON "${table}" USING btree ("_parent_id")`,
];

const COLUMNS = ['_order', '_parent_id', 'id', 'name', 'website_url', 'youtube_url', 'instagram'];

applyAdditiveSchema({
  enumValues: [
    `ALTER TYPE "public"."enum_profile_changes_changed_fields" ADD VALUE IF NOT EXISTS 'projects'`,
    `ALTER TYPE "public"."enum_musician_form_parts_questions_field" ADD VALUE IF NOT EXISTS 'projects'`,
  ],
  statements: [
    projectsTable('musicians_projects', true),
    projectsTable('musician_submissions_projects', true),
    // Modifications proposées : champ affiché sous condition, donc facultatif en base.
    projectsTable('profile_changes_projects', false),
    `ALTER TABLE "musicians_project_links" ALTER COLUMN "item" DROP NOT NULL`,
    parentForeignKey('musicians_projects', 'musicians'),
    parentForeignKey('musician_submissions_projects', 'musician_submissions'),
    parentForeignKey('profile_changes_projects', 'profile_changes'),
    ...indexes('musicians_projects'),
    ...indexes('musician_submissions_projects'),
    ...indexes('profile_changes_projects'),
  ],
  expected: {
    musicians_projects: COLUMNS,
    musician_submissions_projects: COLUMNS,
    profile_changes_projects: COLUMNS,
  },
  done: 'Base à jour : les projets (nom, site, YouTube, Instagram) sont en place.',
});
