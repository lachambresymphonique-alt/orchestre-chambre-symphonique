/**
 * Copie d'un texte dans le presse-papiers, avec repli pour les navigateurs
 * sans API `navigator.clipboard` (ou les pages servies sans HTTPS).
 *
 * Renvoie `false` quand la copie est refusée : à l'appelant de proposer alors
 * la copie à la main (adresse sélectionnée, Cmd + C).
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* presse-papiers indisponible : on tente le repli ci-dessous */
  }

  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  field.remove();

  return ok;
}
