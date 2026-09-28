'use client';

import './admin-theme.css';
import './admin-member-documents.css';
import { useState } from 'react';
import { useDocumentInfo, useField } from '@payloadcms/ui';
import { DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, formatBytes } from '@/lib/documentTypes';

/**
 * Champ « Fichier » d'un document de l'espace membres. Le fichier part
 * directement du navigateur vers le stockage privé, avec le lien signé
 * délivré par /api/membres/documents/televersement ; seuls sa clé, son nom,
 * sa taille et son format sont enregistrés avec le document.
 */
export function DocumentFileField() {
  const { id } = useDocumentInfo();
  const key = useField<string>({ path: 'fileKey' });
  const name = useField<string>({ path: 'fileName' });
  const size = useField<number>({ path: 'fileSize' });
  const type = useField<string>({ path: 'fileType' });
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function upload(file: File) {
    setError('');
    setSent(false);
    if (!DOCUMENT_TYPES[file.type]) {
      setError(`Format non accepté : ${Object.values(DOCUMENT_TYPES).join(', ')}.`);
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError(`Fichier trop lourd : ${formatBytes(MAX_DOCUMENT_BYTES)} au plus.`);
      return;
    }
    setProgress(0);
    try {
      const res = await fetch('/api/membres/documents/televersement', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Erreur ${res.status}`);

      // XMLHttpRequest plutôt que fetch : lui seul donne l'avancement d'un envoi.
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', json.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Stockage : erreur ${xhr.status}`)));
        xhr.onerror = () => reject(new Error('Envoi interrompu. Vérifiez la connexion, ou la règle CORS du stockage.'));
        xhr.send(file);
      });

      key.setValue(json.key);
      name.setValue(file.name);
      size.setValue(file.size);
      type.setValue(file.type);
      setSent(true);
    } catch (err) {
      setError((err as Error).message || 'Envoi impossible.');
    } finally {
      setProgress(null);
    }
  }

  const hasFile = Boolean(key.value);
  const label = type.value ? DOCUMENT_TYPES[type.value] : '';

  return (
    <div className="field-type lcs-docfile">
      <label className="field-label" htmlFor="lcs-docfile-input">
        Fichier <span className="required">*</span>
      </label>
      {hasFile && (
        <div className="lcs-docfile__current">
          <span className="lcs-docfile__name">{name.value}</span>
          <span className="lcs-docfile__meta">{[label, formatBytes(size.value)].filter(Boolean).join(' · ')}</span>
          {id && !sent && (
            <a className="lcs-docfile__open" href={`/api/membres/documents/${id}/fichier`} target="_blank" rel="noreferrer">
              Ouvrir ↗
            </a>
          )}
        </div>
      )}
      <div className="lcs-docfile__actions">
        <input
          id="lcs-docfile-input"
          className="lcs-docfile__input"
          type="file"
          accept={Object.keys(DOCUMENT_TYPES).join(',')}
          disabled={progress !== null}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void upload(file);
          }}
        />
        <label htmlFor="lcs-docfile-input" className="lcs-docfile__pick">
          {progress !== null ? `Envoi… ${progress} %` : hasFile ? 'Remplacer le fichier' : 'Choisir un fichier'}
        </label>
        <span className="lcs-docfile__hint">
          {Object.values(DOCUMENT_TYPES).join(', ')} · {formatBytes(MAX_DOCUMENT_BYTES)} au plus
        </span>
      </div>
      {progress !== null && (
        <div className="lcs-docfile__bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
      {sent && <p className="lcs-promote__info">Fichier envoyé : enregistrez le document pour le publier.</p>}
      {error && (
        <p className="lcs-promote__error" role="alert">
          {error}
        </p>
      )}
      {(key.showError || (!hasFile && key.errorMessage)) && key.errorMessage && (
        <p className="lcs-promote__error" role="alert">
          {key.errorMessage}
        </p>
      )}
    </div>
  );
}

export default DocumentFileField;
