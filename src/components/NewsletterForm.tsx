'use client';

import { useState, FormEvent } from 'react';

export function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    (e.target as HTMLFormElement).reset();
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <form className="newsletter-form" onSubmit={handleSubmit}>
      <input type="email" placeholder="Votre adresse e-mail" required />
      <button
        type="submit"
        style={submitted ? { background: '#2E7D32', borderColor: '#2E7D32', color: '#fff' } : undefined}
      >
        {submitted ? 'Inscrit !' : "S'inscrire"}
      </button>
    </form>
  );
}
