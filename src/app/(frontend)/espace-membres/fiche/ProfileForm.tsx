'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { ProfileField } from '@/lib/profileFields';

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

type Props = {
  fields: ProfileField[];
  /** Valeurs de départ : la proposition en attente, sinon la fiche en ligne. */
  values: Record<string, string>;
  photoUrl: string | null;
  photoPending: boolean;
};

/** Formulaire « Ma fiche » : envoie une proposition à relire (POST /api/membres/fiche). */
export function ProfileForm({ fields, values, photoUrl, photoPending }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const photo = data.get('photo');
    if (photo instanceof File && photo.size > MAX_PHOTO_BYTES) {
      setStatus('error');
      setMessage('Photo trop lourde : 4 Mo au plus.');
      return;
    }
    setStatus('sending');
    setMessage('');
    try {
      const res = await fetch('/api/membres/fiche', { method: 'POST', body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          json?.error ||
            (res.status === 413
              ? 'Envoi trop lourd : choisissez une photo plus légère.'
              : 'Une erreur est survenue. Veuillez réessayer.'),
        );
      }
      setStatus('sent');
      setMessage(json?.message || '');
      router.refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setStatus('error');
      setMessage((err as Error).message);
    }
  }

  return (
    <form className="contact-form member-profile" onSubmit={handleSubmit} encType="multipart/form-data">
      {status === 'sent' && (
        <p className="contact-form__success member-profile__sent" role="status">
          {message}
        </p>
      )}
      {fields.map((field) => {
        const id = `profile-${field.name}`;
        const help = field.help && (
          <p className="member-area__help" id={`${id}-help`}>
            {field.help}
          </p>
        );
        if (field.kind === 'photo') {
          const shown = preview || photoUrl;
          return (
            <div className="form-group member-profile__photo" key={field.name}>
              <label htmlFor={id}>{field.label}</label>
              {shown && (
                <figure className="member-profile__preview">
                  <img src={shown} alt="" />
                  <figcaption>
                    {preview ? 'Nouvelle photo, envoyée avec ce formulaire' : photoPending ? 'Photo en attente de relecture' : 'Photo actuelle'}
                  </figcaption>
                </figure>
              )}
              {/* Champ natif masqué : son bouton, dans la langue du navigateur, détonne sur le site. */}
              <input
                id={id}
                name="photo"
                type="file"
                className="member-profile__file-input"
                accept="image/jpeg,image/png,image/webp"
                aria-describedby={help ? `${id}-help` : undefined}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setPreview(file ? URL.createObjectURL(file) : null);
                  setFileName(file?.name ?? '');
                }}
              />
              <label htmlFor={id} className="member-profile__file-button">
                {fileName ? 'Changer de photo' : shown ? 'Choisir une autre photo' : 'Choisir une photo'}
              </label>
              {fileName && <span className="member-profile__file-name">{fileName}</span>}
              {help}
            </div>
          );
        }
        const common = {
          id,
          name: field.name,
          defaultValue: values[field.name] ?? '',
          'aria-describedby': help ? `${id}-help` : undefined,
        };
        return (
          <div className="form-group" key={field.name}>
            <label htmlFor={id}>{field.label}</label>
            {field.kind === 'longtext' || field.kind === 'lines' ? (
              <textarea {...common} rows={field.name === 'bio' ? 10 : field.kind === 'lines' ? 5 : 3} />
            ) : (
              <input
                {...common}
                type={field.kind === 'url' ? 'url' : 'text'}
                maxLength={field.max}
                required={field.name === 'name'}
              />
            )}
            {help}
          </div>
        );
      })}
      {status === 'error' && (
        <p className="contact-form__error" role="alert">
          {message}
        </p>
      )}
      <button type="submit" className="btn-filled" disabled={status === 'sending'}>
        {status === 'sending' ? 'Envoi…' : 'Envoyer pour relecture →'}
      </button>
      <p className="member-area__help">
        Rien n’est publié avant la relecture de l’équipe. Seuls les champs que vous changez sont
        transmis.
      </p>
    </form>
  );
}
