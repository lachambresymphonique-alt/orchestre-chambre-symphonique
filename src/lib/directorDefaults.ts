/**
 * Page Direction — valeurs par défaut.
 *
 * Tout le texte de la page est modifiable dans l'admin (Pages → Page Direction).
 * Les valeurs ci-dessous servent à la fois de `defaultValue` dans le réglage et
 * de secours à l'affichage tant que le réglage n'a pas été enregistré.
 *
 * Les textes concernant le chef lui-même (photo, rôle, phrase signature,
 * biographie, formation, vidéo, citation) viennent de sa fiche musicien ;
 * `ledeFallback` et `bioFallback` ne s'affichent que si la fiche est vide.
 * Faits repris de la frise de la page À propos publiée.
 *
 * Dans les titres, un mot entre astérisques est rendu en italique coloré :
 * « Une lecture *vivante* du grand répertoire ».
 */

export type DirectorFact = { label: string; value: string };
export type DirectorCard = { eyebrow: string; title: string; linkLabel: string; link: string };

export type DirectorPageContent = {
  hero: {
    eyebrow: string;
    ledeFallback: string;
    facts: DirectorFact[];
    ctaPrimaryText: string;
    ctaPrimaryLink: string;
    ctaSecondaryText: string;
    ctaSecondaryLink: string;
  };
  story: { eyebrow: string; title: string; bioFallback: string };
  path: { eyebrow: string; title: string };
  encore: { eyebrow: string; title: string; cards: DirectorCard[] };
  seo: { metaTitle: string; metaDescription: string };
};

export const DIRECTOR_PAGE_DEFAULTS: DirectorPageContent = {
  hero: {
    eyebrow: 'Direction artistique · Fondateur',
    ledeFallback:
      'Violoniste de formation et docteur en sciences, il fonde La Chambre Symphonique en 2017 et la dirige depuis : un orchestre de chambre qui joue le grand répertoire symphonique.',
    facts: [
      { label: 'Fondateur', value: 'La Chambre Symphonique, 2017' },
      { label: 'Parcours', value: 'Violoniste de formation, docteur en sciences' },
    ],
    ctaPrimaryText: 'Prochains concerts',
    ctaPrimaryLink: '/#concerts',
    ctaSecondaryText: 'Contacter l\'orchestre',
    ctaSecondaryLink: '/contact',
  },
  story: {
    eyebrow: 'Le chef',
    title: 'Une lecture *vivante* du grand répertoire',
    bioFallback: [
      'Chef d\'orchestre atypique, violoniste de formation et docteur en sciences, Loïc Emmelin fonde La Chambre Symphonique en 2017 avec l\'ambition de rassembler des musiciens passionnés autour du répertoire symphonique. Il en assure depuis la direction artistique et musicale.',
      'En 2018, il devient également chef assistant de Fabrice Pierre pour l\'Atelier XX-21 de musique contemporaine au CNSMD de Lyon. À la tête de La Chambre Symphonique, il réunit selon les programmes de quarante à quatre-vingts musiciens issus de conservatoires français, suisses et belges, jeunes professionnels et amateurs éclairés.',
    ].join('\n\n'),
  },
  path: {
    eyebrow: 'Parcours',
    title: 'Formation *& distinctions*',
  },
  encore: {
    eyebrow: 'Et après',
    title: 'L\'orchestre, *c\'est aussi*',
    cards: [
      { eyebrow: 'Les musiciens', title: 'Quarante à quatre-vingts *complices*', linkLabel: 'Voir l\'effectif', link: '/musiciens' },
      { eyebrow: 'La saison', title: 'Les *prochains concerts*', linkLabel: 'Voir la programmation', link: '/#concerts' },
      { eyebrow: 'Soutenir', title: 'Devenir un *mécène*', linkLabel: 'Nous soutenir', link: '/nous-soutenir' },
    ],
  },
  seo: { metaTitle: '', metaDescription: '' },
};

const text = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

/** Merge what the admin saved with the defaults: every empty field falls back. */
export function resolveDirectorPage(raw: unknown): DirectorPageContent {
  const g = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const d = DIRECTOR_PAGE_DEFAULTS;
  const hero = g.hero || {};
  const story = g.story || {};
  const path = g.path || {};
  const encore = g.encore || {};
  const seo = g.seo || {};

  const facts: DirectorFact[] = Array.isArray(hero.facts)
    ? hero.facts
        .map((f: any) => ({ label: text(f?.label, ''), value: text(f?.value, '') }))
        .filter((f: DirectorFact) => f.label && f.value)
    : [];
  const cards: DirectorCard[] = Array.isArray(encore.cards)
    ? encore.cards
        .map((c: any) => ({
          eyebrow: text(c?.eyebrow, ''),
          title: text(c?.title, ''),
          linkLabel: text(c?.linkLabel, ''),
          link: text(c?.link, ''),
        }))
        .filter((c: DirectorCard) => c.title && c.link)
    : [];

  return {
    hero: {
      eyebrow: text(hero.eyebrow, d.hero.eyebrow),
      ledeFallback: text(hero.ledeFallback, d.hero.ledeFallback),
      facts: facts.length ? facts : d.hero.facts,
      ctaPrimaryText: text(hero.ctaPrimaryText, d.hero.ctaPrimaryText),
      ctaPrimaryLink: text(hero.ctaPrimaryLink, d.hero.ctaPrimaryLink),
      ctaSecondaryText: text(hero.ctaSecondaryText, d.hero.ctaSecondaryText),
      ctaSecondaryLink: text(hero.ctaSecondaryLink, d.hero.ctaSecondaryLink),
    },
    story: {
      eyebrow: text(story.eyebrow, d.story.eyebrow),
      title: text(story.title, d.story.title),
      bioFallback: text(story.bioFallback, d.story.bioFallback),
    },
    path: {
      eyebrow: text(path.eyebrow, d.path.eyebrow),
      title: text(path.title, d.path.title),
    },
    encore: {
      eyebrow: text(encore.eyebrow, d.encore.eyebrow),
      title: text(encore.title, d.encore.title),
      cards: cards.length ? cards : d.encore.cards,
    },
    seo: {
      metaTitle: text(seo.metaTitle, ''),
      metaDescription: text(seo.metaDescription, ''),
    },
  };
}
