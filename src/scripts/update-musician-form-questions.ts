/**
 * Formulaire musiciens (Pages → Formulaire musiciens), retouches du 2026-11-20 :
 *  - l'ancienne question « Liens vers d'autres projets » devient la question
 *    « Autres projets » (nom, site, YouTube, Instagram), avec son aide ;
 *  - « emmènerais sur une île déserte » → « emmènerais-tu sur une île déserte » ;
 *  - intitulé des projets : « (site, insta, facebook) ? » → « (site, YouTube, Instagram) » ;
 *  - site internet : l'aide « Une ligne par site internet » est retirée (un seul site).
 *
 * Ne touche qu'aux questions concernées ; le reste du formulaire est réécrit à
 * l'identique (mêmes lignes, mêmes identifiants).
 *
 *   PAYLOAD_MIGRATING=true node --require ./src/patch-next-env.cjs --import tsx src/scripts/update-musician-form-questions.ts           (aperçu)
 *   PAYLOAD_MIGRATING=true node --require ./src/patch-next-env.cjs --import tsx src/scripts/update-musician-form-questions.ts --apply   (écrit)
 *
 * PAYLOAD_MIGRATING=true : pas de synchronisation du schéma au démarrage.
 */
import { getPayload } from 'payload';
import config from '../payload.config';
import { retouch, type Part, type Question } from './musicianFormRetouch';

const show = (q: Question) => `${q.field} · « ${q.label ?? ''} »${q.hint ? ` · aide « ${q.hint} »` : ''}`;

async function main() {
  if (process.env.PAYLOAD_MIGRATING !== 'true') throw new Error('Lancer avec PAYLOAD_MIGRATING=true (pas de synchronisation du schéma).');
  const apply = process.argv.includes('--apply');
  const payload = await getPayload({ config });
  const form = (await payload.findGlobal({ slug: 'musician-form' as any, depth: 0 })) as { parts?: Part[] };
  const parts = Array.isArray(form.parts) ? form.parts : [];
  if (parts.length === 0) throw new Error('Formulaire jamais enregistré : rien à retoucher.');

  let changes = 0;
  const nextParts = parts.map((part) => ({
    ...part,
    questions: (part.questions ?? []).map((question) => {
      const next = retouch(question);
      if (JSON.stringify(next) !== JSON.stringify(question)) {
        changes += 1;
        console.log(`« ${part.title} »\n  avant : ${show(question)}\n  après : ${show(next)}`);
      }
      return next;
    }),
  }));

  if (changes === 0) {
    console.log('Rien à changer : le formulaire est déjà à jour.');
  } else if (!apply) {
    console.log(`\n${changes} question(s) à retoucher. Aperçu seulement : relancer avec --apply pour écrire.`);
  } else {
    await payload.updateGlobal({ slug: 'musician-form' as any, data: { parts: nextParts } as any, overrideAccess: true });
    const check = (await payload.findGlobal({ slug: 'musician-form' as any, depth: 0 })) as { parts?: Part[] };
    const fields = (check.parts ?? []).flatMap((p) => (p.questions ?? []).map((q) => q.field));
    if (fields.includes('projectLinks')) throw new Error('Écriture incomplète : la question « projectLinks » est toujours là.');
    console.log(`\n${changes} question(s) retouchée(s). Questions du formulaire : ${fields.join(', ')}`);
  }

  await (payload.db as any).destroy?.();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
