'use client';

import { useState, FormEvent } from 'react';

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    (e.target as HTMLFormElement).reset();
    setTimeout(() => setSubmitted(false), 3000);
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
          style={submitted ? { background: '#2E7D32', color: '#fff' } : undefined}
        >
          {submitted ? 'Message envoyé !' : 'Envoyer le message'}
        </button>
      </form>
    </div>
  );
}
