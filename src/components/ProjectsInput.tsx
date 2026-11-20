'use client';

import { useId, useState } from 'react';
import { EMPTY_PROJECT, MAX_PROJECTS, PROJECT_NAME_MAX, type Project } from '@/lib/projects';

/**
 * Saisie des « autres projets » dans un formulaire public : un bloc par projet
 * (nom, site, chaîne YouTube, Instagram), autant de blocs qu'on veut.
 * La réponse part dans un seul champ caché, en JSON ; lib/projects.ts la
 * contrôle côté serveur. Un bloc laissé vide est ignoré.
 */

type Row = Project & { key: number };

const FIELDS: { name: keyof Project; label: string; placeholder: string; inputMode?: 'url' }[] = [
  { name: 'name', label: 'Nom du projet', placeholder: 'Quatuor, duo, album…' },
  { name: 'websiteUrl', label: 'Site internet', placeholder: 'www.monprojet.fr', inputMode: 'url' },
  { name: 'youtubeUrl', label: 'Chaîne YouTube', placeholder: 'youtube.com/@machaine', inputMode: 'url' },
  { name: 'instagram', label: 'Instagram', placeholder: '@moncompte' },
];

const isEmpty = (row: Project) => !row.name.trim() && !row.websiteUrl.trim() && !row.youtubeUrl.trim() && !row.instagram.trim();

export function ProjectsInput({ name, initial = [] }: { name: string; initial?: Project[] }) {
  const id = useId();
  const [rows, setRows] = useState<Row[]>(() =>
    (initial.length > 0 ? initial : [EMPTY_PROJECT]).map((project, key) => ({ ...project, key })),
  );
  const [nextKey, setNextKey] = useState(rows.length);

  const filled = rows
    .filter((row) => !isEmpty(row))
    .map(({ name, websiteUrl, youtubeUrl, instagram }) => ({ name, websiteUrl, youtubeUrl, instagram }));
  const set = (key: number, field: keyof Project, value: string) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  const add = () => {
    setRows((current) => [...current, { ...EMPTY_PROJECT, key: nextKey }]);
    setNextKey((k) => k + 1);
  };
  const remove = (key: number) =>
    setRows((current) => {
      const kept = current.filter((row) => row.key !== key);
      return kept.length > 0 ? kept : [{ ...EMPTY_PROJECT, key: nextKey }];
    });

  return (
    <div className="project-inputs">
      <input type="hidden" name={name} value={filled.length > 0 ? JSON.stringify(filled) : ''} />
      {rows.map((row, index) => (
        <fieldset className="project-inputs__project" key={row.key}>
          <legend className="project-inputs__legend">Projet {index + 1}</legend>
          <div className="project-inputs__grid">
            {FIELDS.map((field) => {
              const inputId = `${id}-${row.key}-${field.name}`;
              return (
                <div className={`form-group project-inputs__field project-inputs__field--${field.name}`} key={field.name}>
                  <label htmlFor={inputId}>{field.label}</label>
                  {/* Sans attribut « name » : seul le champ caché est envoyé. */}
                  <input
                    id={inputId}
                    type="text"
                    value={row[field.name]}
                    onChange={(e) => set(row.key, field.name, e.target.value)}
                    placeholder={field.placeholder}
                    maxLength={field.name === 'name' ? PROJECT_NAME_MAX : 300}
                    autoComplete="off"
                    {...(field.name === 'name' ? {} : { inputMode: field.inputMode, autoCapitalize: 'none', spellCheck: false })}
                  />
                </div>
              );
            })}
          </div>
          {(rows.length > 1 || !isEmpty(row)) && (
            <button type="button" className="project-inputs__remove" onClick={() => remove(row.key)}>
              Retirer ce projet
            </button>
          )}
        </fieldset>
      ))}
      {rows.length < MAX_PROJECTS && (
        <button type="button" className="project-inputs__add" onClick={add}>
          + Ajouter un projet
        </button>
      )}
    </div>
  );
}
