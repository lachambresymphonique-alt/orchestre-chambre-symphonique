/**
 * Contrôle des droits d'accès de toutes les collections et de tous les globals.
 *
 *   node --require ./src/patch-next-env.cjs --import tsx src/scripts/check-access.ts
 *
 * Invariant : un compte connecté qui n'est pas administrateur (futur espace
 * membres) n'a jamais plus de droits qu'un visiteur anonyme. Chaque règle est
 * évaluée pour trois personnes — visiteur, membre, administrateur — et le
 * script échoue (code 1) si le membre obtient davantage que le visiteur, ou si
 * l'administrateur perd un droit que le visiteur a.
 *
 * Le script charge la config sans initialiser Payload : aucune connexion à la
 * base, donc aucun push de schéma. Voir src/lib/access.ts.
 */
import config from '../payload.config';

type Grant = 'refus' | 'filtré' | 'tout' | 'erreur';

const PEOPLE = {
  visiteur: null,
  membre: { id: 1, collection: 'membres', email: 'membre@example.org' },
  admin: { id: 1, collection: 'users', email: 'admin@example.org' },
} as const;

const RANK: Record<Grant, number> = { refus: 0, filtré: 1, tout: 2, erreur: -1 };

async function evaluate(rule: unknown, user: unknown): Promise<{ grant: Grant; detail?: string }> {
  if (typeof rule !== 'function') return { grant: 'erreur', detail: 'règle absente' };
  try {
    const result = await rule({ req: { user, headers: new Headers(), context: {} } });
    if (result === true) return { grant: 'tout' };
    if (!result) return { grant: 'refus' };
    return { grant: 'filtré', detail: JSON.stringify(result) };
  } catch (err) {
    return { grant: 'erreur', detail: (err as Error).message };
  }
}

async function main() {
  const sanitized = await config;
  const entities = [
    ...sanitized.collections.map((c) => ({ kind: 'collection', slug: c.slug, access: c.access })),
    ...sanitized.globals.map((g) => ({ kind: 'global', slug: g.slug, access: g.access })),
  ];

  const problems: string[] = [];
  const opened: string[] = [];

  for (const { kind, slug, access } of entities) {
    for (const [operation, rule] of Object.entries(access ?? {})) {
      const [visiteur, membre, admin] = await Promise.all(
        (Object.values(PEOPLE) as unknown[]).map((user) => evaluate(rule, user)),
      );
      const where = `${kind} ${slug} · ${operation}`;
      const grants = `visiteur ${visiteur.grant}, membre ${membre.grant}, admin ${admin.grant}`;

      if ([visiteur, membre, admin].some((r) => r.grant === 'erreur')) {
        problems.push(`${where} : non évaluable (${grants}) ${membre.detail ?? visiteur.detail ?? ''}`);
      } else if (
        RANK[membre.grant] > RANK[visiteur.grant] ||
        (membre.grant === 'filtré' && membre.detail !== visiteur.detail)
      ) {
        problems.push(`${where} : le membre obtient plus que le visiteur (${grants})`);
      } else if (RANK[admin.grant] < RANK[visiteur.grant]) {
        problems.push(`${where} : l'administrateur obtient moins que le visiteur (${grants})`);
      }
      if (visiteur.grant !== 'refus') opened.push(`${where} : ${visiteur.grant}`);
    }
  }

  console.log(`${entities.length} collections et globals contrôlés.`);
  console.log(`Ouvert aux visiteurs anonymes (${opened.length}) :`);
  for (const line of opened) console.log(`  · ${line}`);

  if (problems.length > 0) {
    console.error(`\n${problems.length} problème(s) :`);
    for (const line of problems) console.error(`  ✗ ${line}`);
    process.exitCode = 1;
  } else {
    console.log('\nAucun compte non administrateur n’a plus de droits qu’un visiteur anonyme.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
