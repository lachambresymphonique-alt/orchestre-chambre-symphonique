/**
 * Initialise le global « Menu du site » (`navigation`) à partir du menu
 * historique : pages fixes, puis pages de l'admin cochées « Afficher dans la
 * navigation ». Ne fait rien si le menu contient déjà des entrées (sauf --force).
 *
 * Par défaut le script NE pousse PAS le schéma : la table doit déjà exister
 * (créée par le `next dev` qui re-pousse à chaque changement de config, ou par
 * src/scripts/push-schema.ts). Deux pushs simultanés — script + serveur de dev —
 * se marchent dessus (« relation already exists »). Passez --push pour pousser
 * ici, uniquement si aucun serveur de dev ne tourne.
 *
 *   # Aperçu sans rien écrire
 *   node --require ./src/patch-next-env.cjs --import tsx src/scripts/seed-navigation.ts --dry-run
 *   # Initialisation
 *   node --require ./src/patch-next-env.cjs --import tsx src/scripts/seed-navigation.ts
 */
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const PUSH = process.argv.includes('--push');

// Même garde que la CLI de migration de Payload : désactive le push Drizzle à l'init.
if (!PUSH) process.env.PAYLOAD_MIGRATING = 'true';

import { getPayload } from 'payload';
import config from '../payload.config';
import { BUILTIN_PAGES, legacyNavItems } from '../lib/navigation';

async function main() {
  const payload = await getPayload({ config });

  const current = await payload.findGlobal({ slug: 'navigation' as any, depth: 0 });
  const existing = Array.isArray((current as any)?.items) ? (current as any).items : [];
  if (existing.length > 0 && !FORCE) {
    console.log(
      `\nLe menu contient déjà ${existing.length} entrée(s) — rien à faire (--force pour le remplacer).\n`,
    );
    process.exit(0);
  }

  const { docs: pages } = await payload.find({
    collection: 'pages' as any,
    where: { showInNav: { equals: true }, _status: { equals: 'published' } } as any,
    sort: 'navOrder',
    limit: 50,
    depth: 0,
  });

  // Pages fixes : pas de libellé (le nom par défaut est utilisé) ; pages de
  // l'admin : le libellé du menu ou le titre, comme aujourd'hui.
  const items = legacyNavItems(pages as any[])
    .map((link) => {
      const builtin = BUILTIN_PAGES.find((p) => p.href === link.href);
      if (builtin) return { type: 'builtin', builtin: builtin.value };
      const page = (pages as any[]).find((p) => `/${p.slug}` === link.href);
      return page ? { type: 'page', page: page.id, label: link.label } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  console.log(
    `\nMenu à enregistrer (${items.length} entrées)${DRY_RUN ? ' — aperçu, rien ne sera écrit' : ''} :`,
  );
  items.forEach((item, i) => {
    const what =
      item.type === 'builtin'
        ? BUILTIN_PAGES.find((p) => p.value === item.builtin)?.label
        : `${item.label} (page #${item.page})`;
    console.log(`  ${i + 1}. ${what}`);
  });

  if (!DRY_RUN) {
    await payload.updateGlobal({ slug: 'navigation' as any, data: { items } as any });
    console.log('\nMenu enregistré. Modifiable dans l\'admin : Réglages → Menu du site.\n');
  } else {
    console.log('');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
