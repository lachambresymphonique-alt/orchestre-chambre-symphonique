'use client';

import { useState, FormEvent, useRef, ChangeEvent } from 'react';

const SECTIONS = [
  { value: 'cordes', label: 'Cordes' },
  { value: 'vents', label: 'Vents' },
  { value: 'claviers', label: 'Claviers & percussions' },
  { value: 'direction', label: 'Direction artistique' },
  { value: '', label: 'Je laisse l’équipe décider' },
] as const;

export function MusicianSubmissionForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [section, setSection] = useState<string>('');
  const [photoName, setPhotoName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoName(file ? file.name : '');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const res = await fetch('/api/musician-submissions', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Erreur lors de l’envoi.');
      }

      setStatus('success');
      form.reset();
      setSection('');
      setPhotoName('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 6000);
    }
  };

  if (status === 'success') {
    return (
      <div className="contribute-success">
        <p className="eyebrow eyebrow--gold">Bien reçu</p>
        <h2 className="contribute-success__title">
          <em>Merci</em> pour votre fiche.
        </h2>
        <hr className="velvet-rule long" />
        <p className="contribute-success__body">
          Vos informations viennent d’arriver à l’équipe. Nous les ajouterons
          prochainement à la page Musiciens. Si nous avons besoin d’une
          précision, nous vous écrirons à l’adresse que vous avez indiquée.
        </p>
      </div>
    );
  }

  return (
    <form className="contribute-form" onSubmit={handleSubmit} noValidate>
      {/* ============ ACT 1 — L’essentiel ============ */}
      <fieldset className="contribute-act">
        <legend className="contribute-act__legend">
          <span className="contribute-act__index">i.</span>
          <span className="eyebrow eyebrow--gold">L’essentiel</span>
        </legend>
        <hr className="velvet-rule" />
        <p className="contribute-act__lede">
          Trois champs suffisent pour ouvrir une fiche. Le reste se complète à
          votre rythme.
        </p>

        <div className="contribute-row">
          <div className="form-group">
            <label htmlFor="firstName">Prénom <span aria-hidden>·</span> <em>requis</em></label>
            <input type="text" id="firstName" name="firstName" autoComplete="given-name" required />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Nom <span aria-hidden>·</span> <em>requis</em></label>
            <input type="text" id="lastName" name="lastName" autoComplete="family-name" required />
          </div>
        </div>

        <div className="contribute-row">
          <div className="form-group">
            <label htmlFor="email">E-mail <span aria-hidden>·</span> <em>requis</em></label>
            <input type="email" id="email" name="email" autoComplete="email" required />
            <p className="form-hint">Privé — pour vous joindre, jamais affiché.</p>
          </div>
          <div className="form-group">
            <label htmlFor="phone">Téléphone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              autoComplete="tel"
              placeholder="06 12 34 56 78"
            />
            <p className="form-hint">Privé — pour vous joindre rapidement.</p>
          </div>
        </div>

        <div className="contribute-row">
          <div className="form-group">
            <label htmlFor="role">Rôle / fonction <span aria-hidden>·</span> <em>requis</em></label>
            <input
              type="text"
              id="role"
              name="role"
              placeholder="Violoniste · Cheffe de pupitre · Premier hautbois…"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="instrument">Instrument</label>
            <input
              type="text"
              id="instrument"
              name="instrument"
              placeholder="Violon · Hautbois · Piano…"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Section</label>
          <div className="contribute-pills" role="radiogroup" aria-label="Section">
            {SECTIONS.map((s) => {
              const active = section === s.value;
              const id = `section-${s.value || 'tbd'}`;
              return (
                <label key={id} className={`contribute-pill${active ? ' is-active' : ''}`}>
                  <input
                    type="radio"
                    name="section"
                    value={s.value}
                    id={id}
                    checked={active}
                    onChange={() => setSection(s.value)}
                  />
                  <span>{s.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </fieldset>

      {/* ============ ACT 2 — À propos de vous ============ */}
      <fieldset className="contribute-act">
        <legend className="contribute-act__legend">
          <span className="contribute-act__index">ii.</span>
          <span className="eyebrow eyebrow--gold">À propos de vous</span>
        </legend>
        <hr className="velvet-rule" />
        <p className="contribute-act__lede">
          Ce que vous diriez si on vous tendait le micro pendant l’entracte. On
          peut tout retravailler ensemble.
        </p>

        <div className="form-group">
          <label htmlFor="bio">Biographie</label>
          <textarea
            id="bio"
            name="bio"
            rows={6}
            placeholder="Quelques paragraphes : parcours, répertoire favori, projets en cours…"
          />
        </div>

        <div className="form-group">
          <label htmlFor="inspiringSymphony">La symphonie qui t’a donné envie de faire de la musique</label>
          <input
            type="text"
            id="inspiringSymphony"
            name="inspiringSymphony"
            placeholder="Ex : 9ᵉ symphonie de Beethoven, Symphonie fantastique de Berlioz…"
          />
        </div>

        <div className="form-group">
          <label htmlFor="favoriteWork">L’œuvre que tu préfères</label>
          <input
            type="text"
            id="favoriteWork"
            name="favoriteWork"
            placeholder="Ex : Concerto pour violon op. 35, Le Sacre du printemps…"
          />
        </div>

        <div className="form-group">
          <label htmlFor="favoriteComposer">Compositeur</label>
          <input
            type="text"
            id="favoriteComposer"
            name="favoriteComposer"
            placeholder="Ex : Brahms, Ravel, Chostakovitch…"
          />
        </div>
      </fieldset>

      {/* ============ ACT 3 — Votre parcours ============ */}
      <fieldset className="contribute-act">
        <legend className="contribute-act__legend">
          <span className="contribute-act__index">iii.</span>
          <span className="eyebrow eyebrow--gold">Votre parcours</span>
        </legend>
        <hr className="velvet-rule" />
        <p className="contribute-act__lede">
          Une ligne par entrée. Inutile d’être exhaustif — choisissez ce qui
          compte pour vous aujourd’hui.
        </p>

        <div className="form-group">
          <label htmlFor="formation">Formation</label>
          <textarea
            id="formation"
            name="formation"
            rows={4}
            placeholder={'CNSMD de Lyon, 2018\nMaster class avec Anne-Sophie Mutter, 2020'}
          />
        </div>

        <div className="form-group">
          <label htmlFor="concours">Concours et distinctions</label>
          <textarea
            id="concours"
            name="concours"
            rows={4}
            placeholder={'Premier prix, Concours Long-Thibaud, 2019\nFinaliste, Concours Reine Elisabeth, 2021'}
          />
        </div>
      </fieldset>

      {/* ============ ACT 4 — Image & son ============ */}
      <fieldset className="contribute-act">
        <legend className="contribute-act__legend">
          <span className="contribute-act__index">iv.</span>
          <span className="eyebrow eyebrow--gold">Image &amp; son</span>
        </legend>
        <hr className="velvet-rule" />
        <p className="contribute-act__lede">
          Un portrait, une captation. On retravaillera la photo au tirage du
          site si nécessaire.
        </p>

        <div className="form-group">
          <label htmlFor="photo">Portrait</label>
          <div
            className={`contribute-dropzone${photoName ? ' has-file' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Choisir une photo"
          >
            <input
              ref={fileInputRef}
              type="file"
              id="photo"
              name="photo"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="contribute-dropzone__input"
            />
            <span className="contribute-dropzone__icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="1.5" />
                <circle cx="8.5" cy="10" r="1.6" />
                <path d="M21 16l-5.5-5.5L7 19" />
              </svg>
            </span>
            <span className="contribute-dropzone__copy">
              {photoName ? (
                <>
                  <em>{photoName}</em>
                  <span className="contribute-dropzone__hint">Cliquez pour changer.</span>
                </>
              ) : (
                <>
                  <em>Déposez votre portrait</em>
                  <span className="contribute-dropzone__hint">JPG, PNG ou WebP — 10&nbsp;Mo max.</span>
                </>
              )}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="videoUrl">Lien vidéo</label>
          <input
            type="url"
            id="videoUrl"
            name="videoUrl"
            placeholder="https://youtu.be/… · https://vimeo.com/…"
          />
          <p className="form-hint">Une captation publique, YouTube ou Vimeo.</p>
        </div>

        <div className="form-group">
          <label htmlFor="instagram">Instagram</label>
          <input
            type="text"
            id="instagram"
            name="instagram"
            autoComplete="off"
            placeholder="@votre_compte"
          />
          <p className="form-hint">
            Si vous souhaitez le partager — c’est principalement sur Instagram que
            nous mettons en avant les musiciens.
          </p>
        </div>
      </fieldset>

      {/* ============ Outro ============ */}
      <div className="contribute-outro">
        <p className="contribute-outro__line">
          <em>Merci d’avance.</em> Nous lisons chaque envoi à la main.
        </p>
        <hr className="velvet-rule long" />

        {status === 'error' && (
          <p className="contribute-outro__error" role="alert">
            <em>{errorMsg || 'Une erreur est survenue.'}</em> Merci de réessayer
            ou de nous écrire directement.
          </p>
        )}

        <button type="submit" className="btn-filled" disabled={status === 'sending'}>
          {status === 'sending' ? 'Envoi…' : 'Envoyer ma fiche'}
          <span aria-hidden>→</span>
        </button>

        <p className="contribute-outro__fallback">
          Bloqué ?{' '}
          <a href="mailto:contact@chambre-symphonique.fr?subject=Ma%20fiche%20musicien">
            Écrivez-nous
          </a>{' '}
          et nous reprenons à la main.
        </p>
      </div>
    </form>
  );
}
