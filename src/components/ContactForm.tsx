'use client';

import { useState, FormEvent } from 'react';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    const form = e.target as HTMLFormElement;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      subject: (form.elements.namedItem('subject') as HTMLSelectElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Erreur lors de l\'envoi.');
      }

      setStatus('success');
      form.reset();
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  if (status === 'success') {
    return (
      <div className="contact-form contact-form--success">
        <p className="eyebrow eyebrow--gold">Bien reçu</p>
        <h2 className="contact-form__title">
          <em>Merci.</em>
        </h2>
        <hr className="velvet-rule long" />
        <p className="contact-form__success">
          Votre message vient d'arriver. Nous vous répondrons personnellement,
          en général sous 48 heures.
        </p>
      </div>
    );
  }

  return (
    <div className="contact-form fade-in visible">
      <p className="eyebrow eyebrow--gold">Écrivez-nous</p>
      <h2 className="contact-form__title">
        <em>Un mot,</em> une question
      </h2>
      <hr className="velvet-rule" />
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nom complet</label>
          <input type="text" id="name" name="name" placeholder="Votre nom et prénom" required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Adresse e-mail</label>
          <input type="email" id="email" name="email" placeholder="votre@email.fr" required />
        </div>
        <div className="form-group">
          <label htmlFor="subject">Objet</label>
          <select id="subject" name="subject" required defaultValue="">
            <option value="" disabled>Choisissez un sujet</option>
            <option value="info">Demande d&apos;information</option>
            <option value="reservation">Réservation / Billetterie</option>
            <option value="mecenat">Mécénat / Partenariat</option>
            <option value="presse">Presse / Médias</option>
            <option value="programmation">Programmation / Booking</option>
            <option value="benevolat">Bénévolat</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea id="message" name="message" placeholder="Votre message..." required></textarea>
        </div>

        {status === 'error' && (
          <p className="contact-form__error" role="alert">
            <em>{errorMsg || 'Une erreur est survenue.'}</em> Merci de réessayer.
          </p>
        )}

        <button
          type="submit"
          className="btn-filled"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? 'Envoi…' : 'Envoyer le message →'}
        </button>
      </form>
    </div>
  );
}
