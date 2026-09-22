/**
 * Migration ponctuelle : remplit les nouveaux champs `date` / `time` / `status`
 * des concerts à partir des anciens champs texte `day` + `monthYear`
 * (ex : day = « 18 », monthYear = « Avril 2026 à 18h00 »).
 *
 * Les anciens champs ne sont pas modifiés. Les concerts qui ont déjà une
 * `date` sont ignorés (sauf avec --force).
 *
 *   # Aperçu sans rien écrire
 *   node --require ./src/patch-next-env.cjs --import tsx src/scripts/migrate-concert-dates.ts --dry-run
 *   # Migration
 *   node --require ./src/patch-next-env.cjs --import tsx src/scripts/migrate-concert-dates.ts
 */
import { getPayload } from 'payload';
import config from '../payload.config';
import { canonicalDateForKey, normalizeConcertTime } from '../lib/concerts';

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

const MONTHS: Record<string, number> = {
  janvier: 1,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
};

const stripAccents = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

type Parsed = { key: string | null; time: string | null; reason?: string };

export function parseLegacy(day: unknown, monthYear: unknown): Parsed {
  const dayStr = String(day ?? '').trim();
  const myStr = String(monthYear ?? '').trim();

  const dayMatch = dayStr.match(/\d{1,2}/);
  if (!dayMatch) return { key: null, time: null, reason: `jour illisible « ${dayStr} »` };
  const dayNum = Number(dayMatch[0]);

  const normalized = stripAccents(myStr);
  const monthName = Object.keys(MONTHS).find((m) => new RegExp(`\\b${m}\\b`).test(normalized));
  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  if (!monthName || !yearMatch) {
    return { key: null, time: null, reason: `mois/année illisibles « ${myStr} »` };
  }

  const timeMatch = myStr.match(/(\d{1,2})\s*[hH:]\s*(\d{2})?/);
  const time = timeMatch ? normalizeConcertTime(`${timeMatch[1]}h${timeMatch[2] ?? '00'}`) ?? null : null;

  const key = `${yearMatch[1]}-${String(MONTHS[monthName]).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
  const check = new Date(`${key}T12:00:00.000Z`);
  if (Number.isNaN(check.getTime()) || check.toISOString().slice(0, 10) !== key) {
    return { key: null, time, reason: `date invalide ${key}` };
  }
  return { key, time };
}

async function main() {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: 'concerts' as any,
    limit: 500,
    depth: 0,
    sort: 'id',
  });

  console.log(`\n${docs.length} concert(s) trouvé(s). ${DRY_RUN ? '(aperçu, rien ne sera écrit)' : ''}\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const raw of docs as any[]) {
    const label = `#${raw.id} « ${String(raw.title).slice(0, 48)} »`;

    if (raw.date && !FORCE) {
      skipped += 1;
      console.log(`  = ${label} — déjà daté (${String(raw.date).slice(0, 10)}${raw.time ? ' ' + raw.time : ''}), ignoré`);
      continue;
    }

    const parsed = parseLegacy(raw.day, raw.monthYear);
    if (!parsed.key) {
      failed += 1;
      console.log(`  ! ${label} — impossible de convertir : ${parsed.reason}. À saisir à la main dans l'admin.`);
      continue;
    }

    const data = {
      date: canonicalDateForKey(parsed.key),
      time: raw.time || parsed.time,
      status: raw.status || 'published',
    };
    console.log(
      `  → ${label} — « ${raw.day} ${raw.monthYear} » ⇒ ${parsed.key}${data.time ? ' à ' + data.time : ''} (${data.status})`,
    );

    if (!DRY_RUN) {
      try {
        await payload.update({ collection: 'concerts' as any, id: raw.id, data, depth: 0 });
        updated += 1;
      } catch (err) {
        failed += 1;
        console.log(`  ! ${label} — échec de l'écriture : ${(err as Error).message}`);
      }
    } else {
      updated += 1;
    }
  }

  console.log(
    `\n${DRY_RUN ? 'À migrer' : 'Migrés'} : ${updated} · ignorés : ${skipped} · à traiter à la main : ${failed}\n`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
