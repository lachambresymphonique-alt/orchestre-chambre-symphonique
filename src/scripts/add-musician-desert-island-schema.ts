/**
 * Fiche musicien : « Quel morceau emmènerais-tu sur une île déserte ? ».
 * Ajoute en base ce que ce champ demande — et rien d'autre. Voir additiveSchema.ts.
 *
 *   node --require ./src/patch-next-env.cjs --import tsx src/scripts/add-musician-desert-island-schema.ts
 *   … --dry-run   affiche les instructions sans se connecter à la base
 */
import { applyAdditiveSchema } from './additiveSchema';

applyAdditiveSchema({
  enumValues: [
    `ALTER TYPE "public"."enum_profile_changes_changed_fields" ADD VALUE IF NOT EXISTS 'desertIslandPiece'`,
    `ALTER TYPE "public"."enum_musician_form_parts_questions_field" ADD VALUE IF NOT EXISTS 'desertIslandPiece'`,
  ],
  statements: [
    `ALTER TABLE "musicians" ADD COLUMN IF NOT EXISTS "desert_island_piece" varchar`,
    `ALTER TABLE "musician_submissions" ADD COLUMN IF NOT EXISTS "desert_island_piece" varchar`,
    `ALTER TABLE "profile_changes" ADD COLUMN IF NOT EXISTS "desert_island_piece" varchar`,
    // Libellé de la question sur la page publique, réglable dans Pages → Page Musiciens.
    `ALTER TABLE "musicians_page" ADD COLUMN IF NOT EXISTS "detail_desert_island_label" varchar DEFAULT 'Le morceau à emmener sur une île déserte'`,
  ],
  expected: {
    musicians: ['desert_island_piece'],
    musician_submissions: ['desert_island_piece'],
    profile_changes: ['desert_island_piece'],
    musicians_page: ['detail_desert_island_label'],
  },
  done: 'Base à jour : la question « île déserte » est en place.',
});
