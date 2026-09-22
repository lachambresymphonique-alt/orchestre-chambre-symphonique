/**
 * Textes de secours pour la page Direction.
 *
 * Utilisés uniquement quand la fiche musicien du chef (section « Direction
 * artistique ») n'a pas encore de phrase signature ou de biographie. Les faits
 * sont repris de la frise de la page À propos déjà publiée. Dès que les champs
 * « Phrase signature » et « Biographie » sont remplis dans l'admin
 * (Musiciens → Loïc Emmelin), ils remplacent ces textes.
 */
export const DIRECTOR_FALLBACK = {
  lede:
    'Violoniste de formation et docteur en sciences, il fonde La Chambre Symphonique en 2017 et la dirige depuis : un orchestre de chambre qui joue le grand répertoire symphonique.',
  bio: [
    'Chef d\'orchestre atypique, violoniste de formation et docteur en sciences, Loïc Emmelin fonde La Chambre Symphonique en 2017 avec l\'ambition de rassembler des musiciens passionnés autour du répertoire symphonique. Il en assure depuis la direction artistique et musicale.',
    'En 2018, il devient également chef assistant de Fabrice Pierre pour l\'Atelier XX-21 de musique contemporaine au CNSMD de Lyon. À la tête de La Chambre Symphonique, il réunit selon les programmes de quarante à quatre-vingts musiciens issus de conservatoires français, suisses et belges, jeunes professionnels et amateurs éclairés.',
  ],
  /** Affiché dans le bandeau de faits quand l'instrument n'est pas renseigné. */
  background: 'Violoniste de formation, docteur en sciences',
};
