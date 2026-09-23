/**
 * Migration ponctuelle : donne à chaque concert sa liste de représentations
 * à partir des anciens champs uniques `date` / `time` / `venue` /
 * `bookingLink`. Les concerts qui ont déjà au moins une représentation sont
 * ignorés ; les anciens champs ne sont pas effacés (le hook de la collection
 * les recalcule à chaque enregistrement).
 *
 *   # Aperçu sans rien écrire
 *   PAYLOAD_MIGRATING=true node --require ./src/patch-next-env.cjs --import tsx src/scripts/migrate-concert-performances.ts --dry-run
 *   # Migration
 *   PAYLOAD_MIGRATING=true node --require ./src/patch-next-env.cjs --import tsx src/scripts/migrate-concert-performances.ts
 *
 * PAYLOAD_MIGRATING=true empêche ce script de pousser le schéma : la table
 * `concerts_performances` doit déjà exister (serveur de dev lancé après le
 * changement de Concerts.ts, ou src/scripts/push-schema.ts).
 */
import { getPayload } from 'payload';
import config from '../payload.config';
import { parisDateKey } from '../lib/concerts';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: 'concerts' as any,
    limit: 1000,
    pagination: false,
    depth: 0,
    sort: 'date',
  });

  let migrated = 0;
  let skipped = 0;
  let undated = 0;
  let failed = 0;

  for (const doc of res.docs as any[]) {
    const rows = Array.isArray(doc.performances) ? doc.performances : [];
    if (rows.length > 0) {
      skipped++;
      continue;
    }
    const key = parisDateKey(doc.date ?? null);
    if (!key) {
      undated++;
      console.log(`  · #${doc.id} « ${doc.title} » : pas de date, ignoré`);
      continue;
    }

    const performance = {
      date: doc.date,
      time: doc.time ?? null,
      venue: doc.venue ?? null,
      bookingLink: doc.bookingLink ?? null,
    };
    console.log(
      `  · #${doc.id} « ${doc.title} » → ${key}${doc.time ? ` ${doc.time}` : ''} — ${doc.venue || '(lieu vide)'}`,
    );

    if (DRY_RUN) {
      migrated++;
      continue;
    }
    try {
      await payload.update({
        collection: 'concerts' as any,
        id: doc.id,
        data: { performances: [performance] } as any,
      });
      migrated++;
    } catch (err) {
      failed++;
      console.error(`    ✗ échec pour #${doc.id} :`, err instanceof Error ? err.message : err);
    }
  }

  console.log(
    `${DRY_RUN ? '[aperçu] ' : ''}${migrated} concert(s) migré(s), ${skipped} déjà à jour, ${undated} sans date${failed ? `, ${failed} en échec` : ''}.`,
  );

  await (payload.db as any).destroy?.();
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
