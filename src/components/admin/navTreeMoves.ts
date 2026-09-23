/**
 * Déplacements dans la liste du menu.
 *
 * La liste est plate : chaque ligne porte une profondeur, 0 pour une entrée de
 * premier niveau, 1 pour un lien rangé sous l'entrée du dessus. Déplacer une
 * entrée revient donc à changer son rang et sa profondeur — et, quand elle a
 * des sous-liens, à les emmener avec elle.
 *
 * Module pur : toute la logique est ici pour pouvoir être vérifiée hors du
 * navigateur ; NavTree se contente de l'appliquer au formulaire de Payload.
 */

/** Profondeur retenue pour une ligne : 0 ou 1, rien d'autre. */
export function normalizeDepth(value: unknown): 0 | 1 {
  return Number(value ?? 0) === 1 ? 1 : 0;
}

/**
 * Nombre de lignes emportées par celle du rang `index` : elle-même, plus les
 * sous-liens qui la suivent. Un sous-lien ne transporte que lui-même.
 */
export function blockSize(depths: number[], index: number): number {
  if (depths[index] !== 0) return 1;
  let size = 1;
  while (index + size < depths.length && depths[index + size] === 1) size += 1;
  return size;
}

export type MovePlan = {
  /** Rang d'origine de chaque ligne, dans le nouvel ordre. */
  order: number[];
  /** Profondeur de chaque ligne, dans le nouvel ordre. */
  depths: (0 | 1)[];
};

/**
 * Nouvel ordre après avoir glissé le bloc qui commence au rang `from` juste
 * avant la ligne de rang `gap` (rangs de la liste d'avant le déplacement ;
 * `gap` vaut la longueur de la liste pour un dépôt tout en bas).
 *
 * `wanted` est le niveau visé (voir `wantedDepth`) ; seul le vide le refuse,
 * car rien ne se range sous rien.
 *
 * Une entrée qui a des sous-liens peut être rangée elle-même dans un
 * sous-menu : ses liens l'y suivent et deviennent ses voisins. Le menu n'a
 * qu'un niveau, c'est la seule lecture possible du geste — et rien n'est
 * perdu, tout se ressort de la même façon.
 */
export function planMove(depths: number[], from: number, gap: number, wanted: number): MovePlan {
  const size = blockSize(depths, from);
  const order = depths.map((_, i) => i);
  const block = order.splice(from, size);

  // `gap` est exprimé avant le retrait du bloc : au-delà, il faut le décaler.
  const insert = Math.max(0, Math.min(order.length, gap > from ? gap - size : gap));
  order.splice(insert, 0, ...block);

  const above = insert > 0 ? normalizeDepth(depths[order[insert - 1]]) : null;
  const max = above === null ? 0 : 1;
  const headDepth = Math.min(max, normalizeDepth(wanted)) as 0 | 1;

  const next = order.map((origin, i) => {
    if (i === insert) return headDepth;
    // Les sous-liens emportés restent des sous-liens ; les autres ne bougent pas.
    if (i > insert && i < insert + size) return 1 as const;
    return normalizeDepth(depths[origin]);
  });

  return { order, depths: next };
}

/**
 * Profondeur qu'un dépôt obtiendrait réellement : sert à dessiner le repère
 * pendant le glissement, pour ne pas promettre une imbrication impossible.
 */
export function projectDepth(depths: number[], from: number, gap: number, wanted: number): 0 | 1 {
  const plan = planMove(depths, from, gap, wanted);
  const insert = plan.order.indexOf(from);
  return plan.depths[insert];
}

/**
 * Niveau visé par un dépôt : celui de la ligne qu'on survole — déposer au
 * milieu d'un sous-menu, c'est y entrer ; déposer sur une entrée de premier
 * niveau, c'est en rester une — que `step`, le geste horizontal, corrige d'un
 * cran dans un sens ou dans l'autre.
 */
export function wantedDepth(depths: number[], hovered: number, step: number): 0 | 1 {
  const base = normalizeDepth(depths[hovered]);
  return Math.min(1, Math.max(0, base + step)) as 0 | 1;
}

/**
 * Les lignes dont la profondeur a changé, par rang d'origine : ce que NavTree
 * doit réécrire dans le formulaire une fois les lignes remises en ordre.
 */
export function depthChanges(before: number[], plan: MovePlan): { index: number; depth: 0 | 1 }[] {
  const changes: { index: number; depth: 0 | 1 }[] = [];
  plan.order.forEach((origin, i) => {
    if (normalizeDepth(before[origin]) !== plan.depths[i]) changes.push({ index: i, depth: plan.depths[i] });
  });
  return changes;
}

/**
 * Suite de déplacements unitaires (d'un rang à un autre) qui transforme l'ordre
 * actuel en celui du plan. Payload ne sait déplacer qu'une ligne à la fois.
 */
export function moveSteps(order: number[]): { from: number; to: number }[] {
  const current = order.map((_, i) => i);
  const steps: { from: number; to: number }[] = [];

  order.forEach((origin, target) => {
    const at = current.indexOf(origin);
    if (at === target) return;
    current.splice(at, 1);
    current.splice(target, 0, origin);
    steps.push({ from: at, to: target });
  });

  return steps;
}

/**
 * Supprimer une entrée de premier niveau laisserait ses sous-liens rattachés à
 * l'entrée d'au-dessus, ce que personne n'a demandé : ils remontent au premier
 * niveau. Renvoie les rangs à remonter, avant la suppression.
 */
export function orphansAfterRemoval(depths: number[], index: number): number[] {
  if (normalizeDepth(depths[index]) === 1) return [];
  const orphans: number[] = [];
  for (let i = index + 1; i < depths.length && depths[i] === 1; i += 1) orphans.push(i);
  return orphans;
}

/**
 * Pourquoi la ligne `index` ne peut pas être rangée sous celle du dessus, ou
 * `null` si elle le peut. Sert à écrire l'infobulle du bouton : un bouton
 * éteint sans explication est la meilleure façon de bloquer quelqu'un.
 */
export function indentBlocker(depths: number[], index: number): string | null {
  if (normalizeDepth(depths[index]) === 1) return 'Cette entrée est déjà dans un sous-menu.'
  if (index === 0) return 'C’est la première entrée : il n’y a rien au-dessus pour l’accueillir.'
  return null;
}
