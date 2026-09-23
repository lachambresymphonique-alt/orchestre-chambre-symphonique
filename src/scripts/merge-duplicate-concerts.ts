/**
 * Regroupement ponctuel des concerts en double (2026-09-23).
 *
 * Avant les représentations, un programme joué plusieurs fois avait une fiche
 * par date. Ce script applique un plan explicite, fiche par fiche :
 *  - Beethoven (avril 2026) : les fiches 15, 16, 17 rejoignent la 14, qui porte
 *    alors ses 4 représentations ; 15, 16, 17 sont supprimées.
 *  - Schumann / Mahler « Titan » : la fiche 37 (regroupée à la main) reçoit le
 *    texte de présentation des anciens brouillons 18, 20, 36, qui sont supprimés
 *    (leurs dates sont déjà dans la 37 — vérifié avant suppression).
 *  - Dole (fiche 19) : reste à part (affiche et texte propres à La Commanderie),
 *    son texte long passe en « Présentation », son programme en liste d'œuvres.
 *  - Partout : lieu et ville séparés (« Basilique Notre-Dame » + « Beaune »),
 *    pour l'affichage et les données structurées ; adresses de page (slug).
 *
 * Sécurités :
 *  - l'état de départ est vérifié strictement (titres, nombre de dates, aucune
 *    adresse ni présentation déjà posée, chaque ligne connue du plan) : une
 *    fiche déjà regroupée ou modifiée arrête tout, rien n'est appliqué deux fois ;
 *  - sauvegarde JSON complète avant écriture, dans un fichier neuf (jamais
 *    écrasé), à placer hors du dossier temporaire ;
 *  - toutes les écritures dans UNE transaction : au moindre échec, rien n'est
 *    enregistré ; suppressions d'abord, pour que les adresses prévues soient
 *    libres, puis contrôle de chaque adresse enregistrée ;
 *  - références vers les fiches supprimées (articles, solistes) redirigées.
 *
 *   # Aperçu : rien n'est écrit en base
 *   PAYLOAD_MIGRATING=true node --require ./src/patch-next-env.cjs --import tsx src/scripts/merge-duplicate-concerts.ts --backup=<nouveau-fichier.json>
 *   # Écriture
 *   PAYLOAD_MIGRATING=true node --require ./src/patch-next-env.cjs --import tsx src/scripts/merge-duplicate-concerts.ts --backup=<nouveau-fichier.json> --write
 */
import { writeFileSync } from 'node:fs';
import { commitTransaction, createLocalReq, getPayload, initTransaction, killTransaction } from 'payload';
import config from '../payload.config';
import { parisDateKey } from '../lib/concerts';

const WRITE = process.argv.includes('--write');
const BACKUP = process.argv.find((a) => a.startsWith('--backup='))?.slice('--backup='.length);

type Place = { venue: string; city: string };

/** Lieu et ville, par (fiche, date) : les libellés saisis mélangeaient les deux. */
const PLACES: Record<string, Place> = {
  '14|2026-04-18': { venue: 'Basilique Notre-Dame', city: 'Beaune' },
  '15|2026-04-19': { venue: 'Le Bœuf sur le toit', city: 'Lons-le-Saunier' },
  '17|2026-04-25': { venue: 'Salle polyvalente', city: 'Millery' },
  '16|2026-04-26': { venue: 'Salle Molière', city: 'Lyon' },
  '37|2026-10-31': { venue: 'Salle Olivier Messiaen', city: 'Grenoble' },
  '37|2026-11-01': { venue: 'Basilique Saint-Martin d’Ainay', city: 'Lyon' },
  '37|2026-11-07': { venue: 'Basilique Notre-Dame', city: 'Beaune' },
  '19|2026-11-08': { venue: 'La Commanderie', city: 'Dole' },
};

const norm = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim();
/** Programme tel que saisi, ligne à ligne, espaces et virgule finale en moins. */
const lines = (s: unknown) =>
  String(s ?? '')
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, ' ').trim().replace(/,$/, ''))
    .filter(Boolean)
    .join('\n');

async function main() {
  if (!BACKUP) throw new Error('Indiquez --backup=<fichier.json> : la sauvegarde est obligatoire.');
  const payload = await getPayload({ config });
  const ids = [14, 15, 16, 17, 18, 19, 20, 36, 37];
  const docs = new Map<number, any>();
  for (const id of ids) {
    docs.set(id, await payload.findByID({ collection: 'concerts' as any, id, depth: 0 }));
  }

  // ── Sauvegarde complète avant tout, dans un fichier neuf (flag « wx » : jamais écrasé) ──
  writeFileSync(BACKUP, JSON.stringify({ at: new Date().toISOString(), concerts: [...docs.values()] }, null, 2), {
    flag: 'wx',
  });
  console.log(`Sauvegarde : ${BACKUP}`);

  // ── Garde-fous : les fiches sont bien celles du plan ──
  const expectTitle = (id: number, starts: string) => {
    if (!norm(docs.get(id)?.title).startsWith(starts)) {
      throw new Error(`Fiche ${id} : titre inattendu « ${docs.get(id)?.title} » — plan abandonné, rien n'est écrit.`);
    }
  };
  for (const id of [14, 15, 16, 17]) expectTitle(id, 'Concerto pour violon, Beethoven');
  for (const id of [18, 19, 20, 36, 37]) expectTitle(id, 'Concerto pour Violoncelle de Schumann');

  // État de départ attendu, exactement : sinon le plan a déjà été (en partie) appliqué.
  const fail = (why: string) => {
    throw new Error(`${why} — plan abandonné, rien n'est écrit.`);
  };
  for (const id of ids) {
    const d = docs.get(id);
    const count = (d?.performances ?? []).length;
    if (count !== (id === 37 ? 3 : 1)) fail(`Fiche ${id} : ${count} représentation(s), ${id === 37 ? 3 : 1} attendue(s)`);
    if (d?.slug) fail(`Fiche ${id} : adresse déjà posée (« ${d.slug} »)`);
    if (d?.description) fail(`Fiche ${id} : présentation déjà remplie`);
  }
  for (const id of [14, 15, 16, 17, 19, 37]) {
    for (const r of docs.get(id)?.performances ?? []) {
      if (!PLACES[`${id}|${parisDateKey(r.date)}`]) fail(`Fiche ${id} : date ${parisDateKey(r.date)} absente du plan des lieux`);
    }
  }
  const planned = ['concerto-violon-beethoven-2026', 'schumann-mahler-titan-2026', 'schumann-mahler-titan-dole-2026'];
  const clash = await payload.find({
    collection: 'concerts' as any,
    where: { slug: { in: planned } } as any,
    depth: 0,
    limit: 10,
  });
  if (clash.docs.length) fail(`Adresse prévue déjà prise par la fiche ${(clash.docs[0] as any).id}`);

  const place = (id: number, row: any) => {
    const key = `${id}|${parisDateKey(row.date)}`;
    const p = PLACES[key];
    return p ? { ...row, venue: p.venue, city: p.city } : row;
  };
  const rowsOf = (id: number) => (docs.get(id)?.performances ?? []).map((r: any) => place(id, r));

  // ── Plan ──
  const beethoven = {
    id: 14,
    data: {
      slug: 'concerto-violon-beethoven-2026',
      // Le texte de la fiche 15 (une œuvre par ligne), repris tel quel.
      program: lines(docs.get(15)?.program),
      performances: [14, 15, 17, 16].flatMap((id) =>
        rowsOf(id).map((r: any) => ({ date: r.date, time: r.time, venue: r.venue, city: r.city, bookingLink: r.bookingLink })),
      ),
    },
    drop: [15, 16, 17],
  };
  const titanDescription = norm(docs.get(20)?.program) || norm(docs.get(36)?.program);
  const titan = {
    id: 37,
    data: {
      slug: 'schumann-mahler-titan-2026',
      description: titanDescription,
      performances: rowsOf(37),
    },
    drop: [18, 20, 36],
  };
  const dole = {
    id: 19,
    data: {
      slug: 'schumann-mahler-titan-dole-2026',
      // Titre sans les espaces doublés de la saisie (identique à la fiche 37).
      title: norm(docs.get(19)?.title),
      // Même programme que la fiche 37, dans les mots de l'utilisatrice.
      program: lines(docs.get(37)?.program),
      description: norm(docs.get(19)?.program),
      performances: rowsOf(19),
    },
    drop: [] as number[],
  };

  // ── Contrôle : chaque date d'une fiche supprimée existe dans la fiche conservée ;
  //    ce qui diffère sur cette date (heure, lieu, billetterie) est affiché ──
  const differences: string[] = [];
  for (const plan of [beethoven, titan]) {
    const keptRows = plan.data.performances as any[];
    for (const id of plan.drop) {
      for (const r of docs.get(id)?.performances ?? []) {
        const key = parisDateKey(r.date);
        const kept = keptRows.find((k) => parisDateKey(k.date) === key);
        if (!kept) fail(`La date ${key} de la fiche ${id} manque dans la fiche ${plan.id}`);
        if (plan.id === 14) continue; // Beethoven : la ligne est reprise telle quelle.
        for (const field of ['time', 'bookingLink'] as const) {
          if ((r[field] || null) !== (kept[field] || null)) {
            differences.push(`  · ${key} : ${field} de la fiche ${id} (« ${r[field] ?? '—'} ») non repris, la fiche ${plan.id} garde « ${kept[field] ?? '—'} »`);
          }
        }
      }
    }
  }

  // ── Références vers les fiches supprimées ──
  const dropped = [...beethoven.drop, ...titan.drop];
  const keeperOf = (id: number) => (beethoven.drop.includes(id) ? beethoven.id : titan.id);
  const posts = await payload.find({
    collection: 'posts' as any,
    where: { 'project.concerts': { in: dropped } } as any,
    depth: 0,
    limit: 200,
    draft: true,
  } as any);
  const soloists = await payload.find({
    collection: 'soloists' as any,
    where: { concert: { in: dropped } } as any,
    depth: 0,
    limit: 200,
  });

  // ── Récapitulatif ──
  for (const plan of [beethoven, titan, dole]) {
    console.log(`\n# Fiche ${plan.id} — « ${norm(docs.get(plan.id)?.title)} »`);
    console.log(`  adresse : /concerts/${plan.data.slug}`);
    if ('program' in plan.data) console.log(`  programme : ${String(plan.data.program).replace(/\n/g, ' / ')}`);
    if ('description' in plan.data) console.log(`  présentation : ${String(plan.data.description).slice(0, 90)}… (${String(plan.data.description).length} car.)`);
    for (const r of plan.data.performances as any[]) {
      console.log(`  · ${parisDateKey(r.date)}${r.time ? ` ${r.time}` : ''} — ${r.venue}, ${r.city}${r.bookingLink ? '  [billetterie]' : ''}`);
    }
    if (plan.drop.length) console.log(`  supprimées : ${plan.drop.map((id) => `#${id}`).join(', ')}`);
  }
  console.log(`\nArticles à rediriger : ${posts.docs.length} · solistes à rediriger : ${soloists.docs.length}`);
  if (differences.length) console.log(`\nDifférences sur les dates supprimées (la fiche conservée fait foi) :\n${differences.join('\n')}`);

  if (!WRITE) {
    console.log('\n[aperçu] Rien n’a été écrit. Relancez avec --write pour appliquer.');
    await (payload.db as any).destroy?.();
    process.exit(0);
  }

  // ── Écriture : une seule transaction ──
  const req = await createLocalReq({}, payload);
  if (!(await initTransaction(req))) fail('Transaction impossible à ouvrir');
  try {
    for (const post of posts.docs as any[]) {
      const list = ((post.project?.concerts ?? []) as any[]).map((c) => (typeof c === 'object' ? c.id : c));
      const next = [...new Set(list.map((id: number) => (dropped.includes(Number(id)) ? keeperOf(Number(id)) : id)))];
      await payload.update({ collection: 'posts' as any, id: post.id, data: { project: { ...post.project, concerts: next } } as any, depth: 0, req });
      console.log(`✓ article ${post.id} redirigé`);
    }
    for (const s of soloists.docs as any[]) {
      await payload.update({ collection: 'soloists' as any, id: s.id, data: { concert: keeperOf(Number(s.concert)) } as any, depth: 0, req });
      console.log(`✓ soliste ${s.id} redirigé·e`);
    }
    // Suppressions d'abord : les adresses prévues sont libres pour les fiches conservées.
    for (const id of dropped) {
      await payload.delete({ collection: 'concerts' as any, id, depth: 0, req });
      console.log(`✓ fiche ${id} supprimée`);
    }
    for (const plan of [beethoven, titan, dole]) {
      const saved: any = await payload.update({ collection: 'concerts' as any, id: plan.id, data: plan.data as any, depth: 0, req });
      if (saved?.slug !== plan.data.slug) fail(`Fiche ${plan.id} : adresse enregistrée « ${saved?.slug} » au lieu de « ${plan.data.slug} »`);
      const n = (saved?.performances ?? []).length;
      if (n !== (plan.data.performances as any[]).length) fail(`Fiche ${plan.id} : ${n} représentation(s) enregistrée(s)`);
      console.log(`✓ fiche ${plan.id} mise à jour → /concerts/${saved.slug} (${n} représentation(s))`);
    }
    // La transaction doit être encore active : sinon une erreur interne l'a
    // annulée et les écritures suivantes seraient passées une à une.
    const sessions = (payload.db as any).sessions ?? {};
    if (!req.transactionID || !sessions[req.transactionID as string]) fail('Transaction perdue en cours de route');
    await commitTransaction(req);
  } catch (err) {
    await killTransaction(req);
    console.error('Transaction annulée : aucune modification enregistrée.');
    throw err;
  }

  console.log('\nRegroupement terminé.');
  await (payload.db as any).destroy?.();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('ERREUR :', err instanceof Error ? err.message : err);
  process.exit(1);
});
