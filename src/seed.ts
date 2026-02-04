import { getPayload } from 'payload'
import config from './payload.config'

async function seed() {
  const payload = await getPayload({ config })

  // ──────────────────────────────────────────────
  // 1. Admin user
  // ──────────────────────────────────────────────
  console.log('Creating admin user...')
  await payload.create({
    collection: 'users',
    data: {
      email: 'admin@chambre-symphonique.fr',
      password: 'changeme123',
      name: 'Admin',
    },
  })

  // ──────────────────────────────────────────────
  // 2. Concerts
  // ──────────────────────────────────────────────
  console.log('Creating concerts...')
  const concerts = [
    {
      day: '14',
      monthYear: 'Mars 2026',
      title: 'Les Quatre Saisons revisitées',
      venue: 'Salle Gaveau, Paris',
      program: 'Vivaldi, Piazzolla, Glass — Direction : Marie Laurent',
      bookingLink: '#',
      order: 1,
    },
    {
      day: '28',
      monthYear: 'Mars 2026',
      title: 'Mozart & Beethoven',
      venue: 'Théâtre des Champs-Élysées, Paris',
      program: 'Symphonie n°40, Quatuor op. 18 — Direction : Jean Dufour',
      bookingLink: '#',
      order: 2,
    },
    {
      day: '12',
      monthYear: 'Avril 2026',
      title: 'Soirée Romantique',
      venue: 'Philharmonie de Paris',
      program: 'Schubert, Brahms, Schumann — Soliste : Claire Dubois, piano',
      bookingLink: '#',
      order: 3,
    },
  ]

  for (const concert of concerts) {
    await payload.create({ collection: 'concerts', data: concert })
  }

  // ──────────────────────────────────────────────
  // 3. Musicians
  // ──────────────────────────────────────────────
  console.log('Creating musicians...')
  const musicians = [
    // Direction
    { name: 'Marie Laurent', role: "Directrice artistique & Chef d'orchestre", section: 'direction' as const, order: 1 },
    { name: 'Jean Dufour', role: "Chef d'orchestre associé", section: 'direction' as const, order: 2 },
    // Cordes
    { name: 'Isabelle Moreau', role: 'Premier violon solo', instrument: 'Violon', section: 'cordes' as const, order: 3 },
    { name: 'Antoine Berger', role: 'Second violon solo', instrument: 'Violon', section: 'cordes' as const, order: 4 },
    { name: 'Sophie Chen', role: 'Alto solo', instrument: 'Alto', section: 'cordes' as const, order: 5 },
    { name: 'Thomas Petit', role: 'Violoncelle solo', instrument: 'Violoncelle', section: 'cordes' as const, order: 6 },
    { name: 'Nicolas Fabre', role: 'Contrebasse solo', instrument: 'Contrebasse', section: 'cordes' as const, order: 7 },
    { name: 'Léa Martin', role: 'Tuttiste', instrument: 'Violon', section: 'cordes' as const, order: 8 },
    { name: 'Paul Richard', role: 'Tuttiste', instrument: 'Violon', section: 'cordes' as const, order: 9 },
    { name: 'Émilie Roux', role: 'Tuttiste', instrument: 'Alto', section: 'cordes' as const, order: 10 },
    // Vents
    { name: 'Claire Dubois', role: 'Flûte solo', instrument: 'Flûte traversière', section: 'vents' as const, order: 11 },
    { name: 'Marc Leroy', role: 'Hautbois solo', instrument: 'Hautbois', section: 'vents' as const, order: 12 },
    { name: 'Julie Perrin', role: 'Clarinette solo', instrument: 'Clarinette', section: 'vents' as const, order: 13 },
    { name: 'Alexandre Simon', role: 'Basson solo', instrument: 'Basson', section: 'vents' as const, order: 14 },
    { name: 'David Mercier', role: 'Cor solo', instrument: "Cor d'harmonie", section: 'vents' as const, order: 15 },
    // Claviers
    { name: 'Hélène Garnier', role: 'Pianiste', instrument: 'Piano', section: 'claviers' as const, order: 16 },
    { name: 'Lucas Bernard', role: 'Claveciniste', instrument: 'Clavecin', section: 'claviers' as const, order: 17 },
    { name: 'Raphaël Blanc', role: 'Percussionniste', instrument: 'Timbales & Percussions', section: 'claviers' as const, order: 18 },
  ]

  for (const musician of musicians) {
    await payload.create({ collection: 'musicians', data: musician })
  }

  // ──────────────────────────────────────────────
  // 4. Media Items
  // ──────────────────────────────────────────────
  console.log('Creating media items...')
  const mediaItems = [
    // Videos
    {
      type: 'video' as const,
      title: 'Concert intégral — Les Quatre Saisons',
      description: 'Vivaldi, interprété en formation de chambre. Salle Gaveau, Paris.',
      date: 'Décembre 2025',
      order: 1,
    },
    {
      type: 'video' as const,
      title: "Documentaire — Coulisses de l'orchestre",
      description: 'Un regard intime sur la vie quotidienne des musiciens et le processus de création.',
      date: 'Octobre 2025',
      order: 2,
    },
    {
      type: 'video' as const,
      title: "Masterclass — L'art du quatuor à cordes",
      description: 'Marie Laurent partage sa vision de la musique de chambre avec de jeunes musiciens.',
      date: 'Septembre 2025',
      order: 3,
    },
    // Audio
    {
      type: 'audio' as const,
      title: 'Beethoven — Quatuors op. 18',
      description: "Intégrale des quatuors à cordes opus 18. Enregistré au Studio de Meudon.",
      date: '2024 — Album',
      order: 4,
    },
    {
      type: 'audio' as const,
      title: 'Schubert — La Truite',
      description: 'Quintette en la majeur, D. 667. Enregistrement live au Festival de Verbier.',
      date: '2023 — Album',
      order: 5,
    },
    {
      type: 'audio' as const,
      title: 'Debussy & Ravel — Quatuors',
      description: 'Les deux quatuors à cordes emblématiques du répertoire français.',
      date: '2022 — Album',
      order: 6,
    },
  ]

  for (const item of mediaItems) {
    await payload.create({ collection: 'media-items', data: item })
  }

  // ──────────────────────────────────────────────
  // 5. Partners
  // ──────────────────────────────────────────────
  console.log('Creating partners...')
  const partners = [
    { name: 'Ministère de la Culture', order: 1 },
    { name: 'Région Île-de-France', order: 2 },
    { name: 'Ville de Paris', order: 3 },
    { name: 'Fondation pour la Musique', order: 4 },
    { name: 'Sacem', order: 5 },
    { name: 'France Musique', order: 6 },
    { name: 'Mécénat Musical', order: 7 },
    { name: 'Philharmonie de Paris', order: 8 },
  ]

  for (const partner of partners) {
    await payload.create({ collection: 'partners', data: partner })
  }

  // ──────────────────────────────────────────────
  // 6. Timeline Events
  // ──────────────────────────────────────────────
  console.log('Creating timeline events...')
  const timelineEvents = [
    {
      year: '2010',
      description:
        "Fondation de l'Orchestre de la Chambre Symphonique par Marie Laurent et un groupe de musiciens partageant la même vision artistique. Premier concert à la Salle Cortot.",
      order: 1,
    },
    {
      year: '2013',
      description:
        "Première résidence artistique au Festival d'Aix-en-Provence. L'orchestre commence à se faire remarquer par la critique pour ses interprétations audacieuses.",
      order: 2,
    },
    {
      year: '2016',
      description:
        'Lancement du programme de médiation culturelle "Musique pour Tous" dans les écoles d\'Île-de-France. Plus de 5 000 élèves touchés dès la première année.',
      order: 3,
    },
    {
      year: '2019',
      description:
        'Premier enregistrement discographique consacré aux quatuors de Beethoven, salué par la presse spécialisée. Tournée européenne dans 12 pays.',
      order: 4,
    },
    {
      year: '2022',
      description:
        'Installation dans la nouvelle salle de répétition au coeur de Paris. Début de la collaboration avec la Philharmonie de Paris pour la saison "Nouvelles Voix".',
      order: 5,
    },
    {
      year: '2025',
      description:
        "Célébration des 15 ans de l'orchestre avec une saison exceptionnelle mêlant grands classiques et créations mondiales. Lancement de la plateforme de concerts en ligne.",
      order: 6,
    },
  ]

  for (const event of timelineEvents) {
    await payload.create({ collection: 'timeline-events', data: event })
  }

  // ──────────────────────────────────────────────
  // 7. Support Tiers
  // ──────────────────────────────────────────────
  console.log('Creating support tiers...')
  const supportTiers = [
    {
      name: 'Cercle Allegro',
      minAmount: 50,
      description:
        'Recevez notre lettre exclusive, des invitations aux répétitions ouvertes et votre nom au programme de saison.',
      ctaText: 'Rejoindre',
      ctaLink: '#',
      highlighted: false,
      order: 1,
    },
    {
      name: 'Cercle Vivace',
      minAmount: 200,
      description:
        'En plus des avantages Allegro : places privilégiées, rencontre avec les artistes après concert, accès aux événements privés.',
      ctaText: 'Rejoindre',
      ctaLink: '#',
      highlighted: true,
      order: 2,
    },
    {
      name: 'Cercle Maestoso',
      minAmount: 1000,
      description:
        'Tous les avantages précédents, plus : dîner annuel avec la direction, mention sur nos supports de communication, accès VIP à tous nos événements.',
      ctaText: 'Nous contacter',
      ctaLink: '/contact',
      highlighted: false,
      order: 3,
    },
  ]

  for (const tier of supportTiers) {
    await payload.create({ collection: 'support-tiers', data: tier })
  }

  // ──────────────────────────────────────────────
  // 8. Globals — Site Settings
  // ──────────────────────────────────────────────
  console.log('Updating site-settings global...')
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      contact: {
        address: '12 Rue de la Musique\n75008 Paris, France',
        email: 'contact@chambre-symphonique.fr',
        phone: '+33 1 42 00 00 00',
      },
      social: {
        facebook: '#',
        instagram: '#',
        youtube: '#',
        linkedin: '#',
        tiktok: '#',
      },
      hours: [
        { label: 'Lundi — Vendredi', hours: '9h00 — 18h00' },
        { label: 'Samedi', hours: '10h00 — 13h00' },
        { label: 'Dimanche', hours: 'Fermé' },
      ],
      footerDescription:
        "L'Orchestre de la Chambre Symphonique est un ensemble musical d'excellence dédié à la musique de chambre et symphonique.",
    },
  })

  // ──────────────────────────────────────────────
  // 9. Globals — Home Page
  // ──────────────────────────────────────────────
  console.log('Updating home-page global...')
  await payload.updateGlobal({
    slug: 'home-page',
    data: {
      hero: {
        subtitle: 'Saison 2025 — 2026',
        titleLine1: "L'émotion de la musique",
        titleLine2Italic: 'de chambre',
        description:
          "Un ensemble d'artistes passionnés au service d'un répertoire riche et exigeant, de la musique baroque aux créations contemporaines.",
        ctaPrimaryText: 'Prochains concerts',
        ctaPrimaryLink: '#concerts',
        ctaSecondaryText: "Découvrir l'orchestre",
        ctaSecondaryLink: '/a-propos',
      },
      presentation: {
        subtitle: 'Notre histoire',
        title: "Un orchestre au service\nde l'excellence musicale",
        paragraphs:
          "Fondé en 2010, l'Orchestre de la Chambre Symphonique réunit des musiciens d'exception autour d'une vision commune : rendre la musique de chambre accessible à tous, sans jamais compromettre l'exigence artistique.\n\nDe la musique baroque aux compositions contemporaines, notre répertoire témoigne d'une curiosité insatiable et d'un amour profond pour toutes les formes d'expression musicale.",
        ctaText: 'En savoir plus',
        ctaLink: '/a-propos',
        signature: '— Marie Laurent, Directrice artistique',
      },
      newsletter: {
        subtitle: 'Restez informé',
        title: 'Être informé des prochains concerts',
        description:
          "Inscrivez-vous à notre lettre d'information pour recevoir en avant-première nos dates de concert, nos actualités et nos offres exclusives.",
      },
    },
  })

  // ──────────────────────────────────────────────
  // 10. Globals — About Page
  // ──────────────────────────────────────────────
  console.log('Updating about-page global...')
  await payload.updateGlobal({
    slug: 'about-page',
    data: {
      intro: {
        subtitle: 'Notre mission',
        title: 'Porter la musique de chambre\nau plus grand nombre',
        content:
          "L'Orchestre de la Chambre Symphonique est né d'une conviction profonde : la musique classique n'est pas un art élitiste, mais un langage universel capable de toucher chaque individu, quelle que soit son origine ou sa culture.\n\nDepuis sa création en 2010, notre ensemble réunit des musiciens issus des plus grandes formations européennes, unis par une même passion : offrir des interprétations vibrantes qui honorent le répertoire tout en le rendant vivant et accessible.\n\nNotre approche artistique mêle rigueur d'interprétation et ouverture d'esprit. Nous explorons avec la même ferveur les chefs-d'oeuvre du répertoire classique et les créations contemporaines, convaincus que la tradition se nourrit de l'innovation.\n\nAu-delà des concerts, nous menons un important travail de médiation culturelle auprès des publics scolaires, hospitaliers et des territoires éloignés de l'offre culturelle. Car la musique prend tout son sens lorsqu'elle est partagée.",
      },
      stats: [
        { number: '35', label: 'Musiciens' },
        { number: '80+', label: 'Concerts par an' },
        { number: '15', label: "Années d'existence" },
        { number: '50k', label: 'Spectateurs par an' },
      ],
    },
  })

  // ──────────────────────────────────────────────
  // 11. Globals — Support Page
  // ──────────────────────────────────────────────
  console.log('Updating support-page global...')
  await payload.updateGlobal({
    slug: 'support-page',
    data: {
      supportTypes: [
        {
          title: 'Faire un don',
          description:
            'Chaque contribution, quelle que soit sa taille, permet de soutenir nos concerts, nos actions de médiation et la rémunération de nos artistes. Les dons sont déductibles des impôts.',
          ctaText: 'Faire un don',
          ctaLink: '#',
        },
        {
          title: 'Devenir mécène',
          description:
            'Entreprises et particuliers, le mécénat vous offre une visibilité privilégiée auprès de notre public tout en contribuant au rayonnement culturel. Avantages fiscaux attractifs.',
          ctaText: 'Nous contacter',
          ctaLink: '/contact',
        },
        {
          title: 'Devenir bénévole',
          description:
            "Rejoignez notre équipe de bénévoles pour l'accueil du public, la logistique des concerts ou l'organisation d'événements. Une expérience humaine et culturelle unique.",
          ctaText: "Rejoindre l'équipe",
          ctaLink: '/contact',
        },
      ],
      taxInfo: {
        subtitle: 'Avantage fiscal',
        title: 'Votre don est déductible',
        description:
          "L'Orchestre de la Chambre Symphonique est reconnu d'intérêt général. À ce titre, vos dons ouvrent droit à une réduction d'impôt.",
        individualRate: '66%',
        corporateRate: '60%',
        example:
          'Un don de 100 € ne vous coûte en réalité que 34 € après déduction fiscale (particuliers).',
      },
    },
  })

  console.log('Seed completed successfully!')
  process.exit(0)
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
