'use client';

import { useRowLabel } from '@payloadcms/ui';
import type { CSSProperties } from 'react';
import {
  SECTION_DEFAULT_LABELS,
  fieldAdminLabel,
  isCoreField,
  isSectionValue,
} from '@/lib/musicianForm';

/**
 * Étiquettes des lignes du global « Formulaire musiciens ».
 *
 * Sans elles, l'admin affiche « Partie 01 » / « Question 03 » : on ne voit pas
 * ce que contient une ligne repliée. Styles en ligne pour ne pas toucher aux
 * feuilles de style partagées.
 */

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];

const muted: CSSProperties = { color: 'var(--theme-elevation-500)', fontWeight: 400 };
const strong: CSSProperties = { fontWeight: 600 };
const badge: CSSProperties = {
  marginLeft: '0.5rem',
  padding: '0.1rem 0.4rem',
  borderRadius: 4,
  fontSize: '0.72em',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  background: 'color-mix(in srgb, var(--lcs-gold, #C9A84C) 18%, transparent)',
  color: 'var(--lcs-gold-dark, #A07D2E)',
  whiteSpace: 'nowrap',
};

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** « i. L'essentiel · 7 questions » */
export function MusicianFormPartRowLabel() {
  const { data, rowNumber } = useRowLabel<{ title?: string; questions?: unknown[] }>();
  const index = typeof rowNumber === 'number' ? rowNumber : 0;
  const numeral = ROMAN[index] ?? String(index + 1);
  const count = Array.isArray(data?.questions) ? data.questions.length : 0;

  return (
    <span>
      <span style={muted}>{numeral}.</span>{' '}
      <span style={strong}>{data?.title?.trim() || 'Partie sans titre'}</span>{' '}
      <span style={muted}>· {count > 0 ? plural(count, 'question', 'questions') : 'aucune question'}</span>
    </span>
  );
}

/** « Prénom — “Prénom” · obligatoire » */
export function MusicianFormQuestionRowLabel() {
  const { data } = useRowLabel<{ field?: string; label?: string; required?: boolean }>();
  const key = data?.field;

  if (!key) {
    return <span style={muted}>Nouvelle question — choisissez l’information demandée</span>;
  }

  const catalogue = fieldAdminLabel(key) || key;
  const shown = data?.label?.trim();
  const isRequired = isCoreField(key) || data?.required === true;

  return (
    <span>
      <span style={strong}>{catalogue}</span>
      {shown && shown !== catalogue && <span style={muted}> — « {shown} »</span>}
      {isRequired && <span style={badge}>obligatoire</span>}
    </span>
  );
}

/** « Cordes — “Les cordes” » */
export function MusicianFormChoiceRowLabel() {
  const { data } = useRowLabel<{ value?: string; label?: string }>();
  const value = data?.value;

  if (!isSectionValue(value)) {
    return <span style={muted}>Nouveau choix — sélectionnez un pupitre</span>;
  }

  const fallback = SECTION_DEFAULT_LABELS[value];
  const shown = data?.label?.trim();

  return (
    <span>
      <span style={strong}>{fallback}</span>
      {shown && shown !== fallback && <span style={muted}> — « {shown} »</span>}
    </span>
  );
}

/** Note affichée à la place de la case « obligatoire » sur les questions clés. */
export function MusicianFormCoreNote() {
  return (
    <p
      style={{
        margin: '0 0 1rem',
        padding: '0.6rem 0.8rem',
        borderRadius: 6,
        background: 'var(--theme-elevation-50)',
        border: '1px dashed var(--theme-elevation-200)',
        fontSize: '0.8rem',
        lineHeight: 1.5,
        color: 'var(--theme-elevation-800)',
      }}
    >
      Cette question est toujours posée et toujours obligatoire : sans elle, la fiche reçue ne peut
      pas être créée. Vous pouvez en changer le libellé, mais pas la retirer.
    </p>
  );
}
