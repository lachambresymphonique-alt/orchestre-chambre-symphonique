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

  return (
    <div className="contact-form fade-in visible">
      <h2 style={{ marginBottom: '2rem' }}>Envoyez-nous un message</h2>
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
        <button
          type="submit"
          className="btn btn-primary"
          disabled={status === 'sending'}
          style={
            status === 'success' ? { background: '#2E7D32', color: '#fff' } :
            status === 'error' ? { background: '#C62828', color: '#fff' } :
            undefined
          }
        >
          {status === 'sending' && 'Envoi en cours...'}
          {status === 'success' && 'Message envoyé !'}
          {status === 'error' && errorMsg}
          {status === 'idle' && 'Envoyer le message'}
        </button>
      </form>
    </div>
  );
}
