'use client';

import { TextField, useField, useFormFields } from '@payloadcms/ui';
import type { TextFieldClientComponent } from 'payload';
import { useEffect, useRef } from 'react';
import { altFromFilename } from '@/lib/altFromFilename';

/**
 * Champ « Description de l'image » : dès qu'un fichier est choisi, propose une
 * description tirée de son nom (lib/altFromFilename), tant que la personne
 * n'a rien écrit elle-même. Ne touche jamais à une description existante.
 */
export const AltTextField: TextFieldClientComponent = (props) => {
  const path = props.path ?? props.field.name;
  const { value, setValue } = useField<string>({ path });
  const file = useFormFields(([fields]) => fields?.file?.value);
  const fileName = typeof File !== 'undefined' && file instanceof File ? file.name : '';
  const proposed = useRef('');

  useEffect(() => {
    if (!fileName) return;
    const current = (value ?? '').trim();
    // Texte saisi à la main : on le garde.
    if (current && current !== proposed.current) return;
    const next = altFromFilename(fileName);
    proposed.current = next;
    if (next !== current) setValue(next);
    // Seul un nouveau fichier déclenche une proposition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileName]);

  return <TextField {...props} />;
};
