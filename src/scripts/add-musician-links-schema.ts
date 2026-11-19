/**
 * Fiche musicien : site internet, crédit photo, liens vers d'autres projets.
 * Ajoute en base ce que ces champs demandent — et rien d'autre (appliqué le
 * 2026-11-19 ; relancer le script ne change rien). Voir additiveSchema.ts.
 *
 *   node --require ./src/patch-next-env.cjs --import tsx src/scripts/add-musician-links-schema.ts
 *   … --dry-run   affiche les instructions sans se connecter à la base
 */
import { applyAdditiveSchema, parentForeignKey } from './additiveSchema';

applyAdditiveSchema({
  enumValues: [
    `ALTER TYPE "public"."enum_profile_changes_changed_fields" ADD VALUE IF NOT EXISTS 'photoCredit'`,
    `ALTER TYPE "public"."enum_profile_changes_changed_fields" ADD VALUE IF NOT EXISTS 'websiteUrl'`,
    `ALTER TYPE "public"."enum_profile_changes_changed_fields" ADD VALUE IF NOT EXISTS 'projectLinks'`,
    `ALTER TYPE "public"."enum_musician_form_parts_questions_field" ADD VALUE IF NOT EXISTS 'photoCredit'`,
    `ALTER TYPE "public"."enum_musician_form_parts_questions_field" ADD VALUE IF NOT EXISTS 'websiteUrl'`,
    `ALTER TYPE "public"."enum_musician_form_parts_questions_field" ADD VALUE IF NOT EXISTS 'projectLinks'`,
  ],
  statements: [
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
    parentForeignKey('musicians_project_links', 'musicians'),
    parentForeignKey('profile_changes_project_links', 'profile_changes'),
    `CREATE INDEX IF NOT EXISTS "musicians_project_links_order_idx" ON "musicians_project_links" USING btree ("_order")`,
    `CREATE INDEX IF NOT EXISTS "musicians_project_links_parent_id_idx" ON "musicians_project_links" USING btree ("_parent_id")`,
    `CREATE INDEX IF NOT EXISTS "profile_changes_project_links_order_idx" ON "profile_changes_project_links" USING btree ("_order")`,
    `CREATE INDEX IF NOT EXISTS "profile_changes_project_links_parent_id_idx" ON "profile_changes_project_links" USING btree ("_parent_id")`,
  ],
  expected: {
    musicians: ['photo_credit', 'website_url'],
    musicians_project_links: ['_order', '_parent_id', 'id', 'item'],
    profile_changes: ['photo_credit', 'website_url'],
    profile_changes_project_links: ['_order', '_parent_id', 'id', 'item'],
    musician_submissions: ['photo_credit', 'website_url', 'project_links'],
  },
  done: 'Base à jour : site internet, crédit photo et autres projets sont en place.',
});
