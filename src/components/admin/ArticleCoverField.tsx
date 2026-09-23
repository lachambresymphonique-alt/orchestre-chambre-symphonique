'use client';

import './admin-article.css';
import { useCallback, useEffect, useState } from 'react';
import { Button, useConfig, useDocumentDrawer, useField, useListDrawer } from '@payloadcms/ui';
import type { UploadFieldClientProps } from 'payload';

type MediaDoc = {
  id: string | number;
  url?: string | null;
  alt?: string | null;
  filename?: string | null;
  sizes?: Record<string, { url?: string | null } | undefined>;
};

type Value = MediaDoc | string | number | null | undefined;

/**
 * Image de couverture de l’article, présentée comme sur la page publique :
 * un grand cadre 21/9 qui déborde du bandeau sur le corps de l’article.
 * Vide, il invite à choisir une image dans la bibliothèque ou à en
 * téléverser une ; plein, il propose de la changer ou de la retirer.
 */
export function ArticleCoverField(props: UploadFieldClientProps) {
  const { path, field } = props;
  const { value, setValue, showError, errorMessage, disabled } = useField<Value>({ path });
  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig();

  const relationTo = Array.isArray(field.relationTo) ? field.relationTo[0] : field.relationTo;
  const [doc, setDoc] = useState<MediaDoc | null>(null);

  const [ListDrawer, , { openDrawer: openLibrary, closeDrawer: closeLibrary }] = useListDrawer({
    collectionSlugs: [relationTo],
    uploads: true,
  });
  const [DocumentDrawer, , { openDrawer: openUpload, closeDrawer: closeUpload }] =
    useDocumentDrawer({ collectionSlug: relationTo });

  const id = value && typeof value === 'object' ? value.id : value;

  // La valeur du formulaire est l’identifiant de l’image : on va chercher
  // son adresse pour l’afficher (sauf si le document est déjà peuplé).
  useEffect(() => {
    if (value && typeof value === 'object') {
      setDoc(value);
      return;
    }
    if (!id) {
      setDoc(null);
      return;
    }
    let cancelled = false;
    setDoc((current) => (current && String(current.id) === String(id) ? current : null));
    fetch(`${serverURL}${api}/${relationTo}/${id}?depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: MediaDoc | null) => {
        if (!cancelled && d && d.id !== undefined) setDoc(d);
      })
      .catch(() => {
        // Image introuvable : le cadre reste vide, l’identifiant est conservé.
      });
    return () => {
      cancelled = true;
    };
  }, [id, value, api, serverURL, relationTo]);

  const pick = useCallback(
    (d: MediaDoc | null | undefined) => {
      if (!d || d.id === undefined) return;
      setDoc(d);
      setValue(d.id);
    },
    [setValue],
  );

  const clear = useCallback(() => {
    setDoc(null);
    setValue(null);
  }, [setValue]);

  const src = doc?.url || doc?.sizes?.card?.url || null;
  const fieldId = `field-${path.replace(/\./g, '__')}`;

  return (
    <div className={`field-type upload lcs-cover${showError ? ' error' : ''}`} id={fieldId}>
      <figure className={`lcs-cover__frame${src ? '' : ' lcs-cover__frame--empty'}`}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={doc?.alt || ''} />
        ) : (
          <div className="lcs-cover__empty">
            <span className="lcs-cover__eyebrow">Image de couverture</span>
            <p>
              Grande image en tête de l’article et vignette dans la liste du blog.
              Format paysage recommandé.
            </p>
            <div className="lcs-cover__buttons">
              <Button buttonStyle="primary" size="small" onClick={openLibrary} disabled={disabled}>
                Choisir dans la bibliothèque
              </Button>
              <Button buttonStyle="secondary" size="small" onClick={openUpload} disabled={disabled}>
                Téléverser une photo
              </Button>
            </div>
          </div>
        )}
        {src && !disabled && (
          <div className="lcs-cover__actions">
            <Button buttonStyle="secondary" size="small" onClick={openLibrary}>
              Changer
            </Button>
            <Button buttonStyle="secondary" size="small" onClick={openUpload}>
              Téléverser
            </Button>
            <Button buttonStyle="secondary" size="small" onClick={clear}>
              Retirer
            </Button>
          </div>
        )}
      </figure>
      {showError && errorMessage && (
        <p className="lcs-article__error" role="alert">
          {errorMessage}
        </p>
      )}
      <ListDrawer
        onSelect={({ doc: selected }) => {
          pick(selected as MediaDoc);
          closeLibrary();
        }}
      />
      <DocumentDrawer
        onSave={({ doc: saved }) => {
          pick(saved as unknown as MediaDoc);
          closeUpload();
        }}
      />
    </div>
  );
}

export default ArticleCoverField;
