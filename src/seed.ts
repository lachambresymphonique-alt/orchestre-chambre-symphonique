import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
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
      email: 'admin@lachambresymphonique.fr',
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
      day: '13',
      monthYear: 'Juin 2025',
      title: 'Grande Messe en ut mineur — Mozart',
      venue: 'Abbaye Saint-Philibert, Tournus',
      program: 'Mozart, Messe en ut mineur K.427 — Avec le Chœur Opus 71, dir. Christian Garneret',
      bookingLink: 'https://www.helloasso.com/associations/la-chambre-symphonique',
      order: 1,
    },
    {
      day: '14',
      monthYear: 'Juin 2025',
      title: 'Grande Messe en ut mineur — Mozart',
      venue: 'Église Saint-Cosme, Chalon-sur-Saône',
      program: 'Mozart, Messe en ut mineur K.427 — Avec le Chœur Opus 71, dir. Christian Garneret',
      bookingLink: 'https://www.helloasso.com/associations/la-chambre-symphonique',
      order: 2,
    },
    {
      day: '15',
      monthYear: 'Juin 2025',
      title: 'Grande Messe en ut mineur — Mozart',
      venue: 'Basilique Notre-Dame, Beaune',
      program: 'Mozart, Messe en ut mineur K.427 — Avec le Chœur Opus 71, dir. Christian Garneret',
      bookingLink: 'https://www.helloasso.com/associations/la-chambre-symphonique',
      order: 3,
    },
    {
      day: '8',
      monthYear: 'Août 2025',
      title: 'Mouvements Symphoniques — Musiques pour la danse',
      venue: 'La Commanderie, Dôle',
      program: 'Debussy — Prélude à l\'après-midi d\'un faune, Prokofiev — Roméo et Juliette Suite n°2, Ravel — Valse & Boléro',
      bookingLink: 'https://www.helloasso.com/associations/la-chambre-symphonique',
      order: 4,
    },
    {
      day: '10',
      monthYear: 'Août 2025',
      title: 'Mouvements Symphoniques — Musiques pour la danse',
      venue: 'Église de Saint-Marcel, Cluny — Grandes Heures de Cluny',
      program: 'Debussy — Prélude à l\'après-midi d\'un faune, Prokofiev — Roméo et Juliette Suite n°2, Ravel — Valse & Boléro',
      bookingLink: 'https://www.grandesheuresdecluny.com',
      order: 5,
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
    { name: 'Loïc Emmelin', role: "Fondateur, Directeur artistique & Chef d'orchestre", section: 'direction' as const, order: 1 },
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
      title: 'L\'aube sur la rivière Moskova — Moussorgski',
      description: 'Prologue de l\'Acte I de La Khovanchtchina. La Chambre Symphonique, dir. Loïc Emmelin.',
      date: '2024',
      order: 1,
    },
    {
      type: 'video' as const,
      title: 'Simple Symphony — Benjamin Britten',
      description: 'Mouvements 3 et 4. La Chambre Symphonique, dir. Loïc Emmelin.',
      date: '2022',
      order: 2,
    },
    // Audio
    {
      type: 'audio' as const,
      title: 'Shéhérazade — Rimski-Korsakov',
      description: 'Concert symphonique, février 2025. La Chambre Symphonique, dir. Loïc Emmelin.',
      date: 'Février 2025',
      order: 3,
    },
    {
      type: 'audio' as const,
      title: 'Le Lac des cygnes — Tchaïkovski',
      description: 'Suite du ballet. Cathédrale Saint-Vincent, Chalon-sur-Saône, juin 2023.',
      date: 'Juin 2023',
      order: 4,
    },
    {
      type: 'audio' as const,
      title: 'Une nuit sur le Mont Chauve — Moussorgski',
      description: 'Cathédrale Saint-Vincent, Chalon-sur-Saône, juin 2023.',
      date: 'Juin 2023',
      order: 5,
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
    { name: 'Grandes Heures de Cluny', order: 1 },
    { name: 'Chœur Opus 71', order: 2 },
    { name: 'Athina Culture Comm', order: 3 },
    { name: 'Conservatoire de Chalon-sur-Saône', order: 4 },
    { name: 'CNSMD de Lyon', order: 5 },
    { name: 'HelloAsso', order: 6 },
    { name: 'BFC Classique', order: 7 },
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
      year: '2017',
      description:
        "Fondation de La Chambre Symphonique par Loïc Emmelin, chef d'orchestre atypique, violoniste de formation et docteur en sciences. L'association voit le jour avec l'ambition de rassembler des musiciens passionnés autour du répertoire symphonique.",
      order: 1,
    },
    {
      year: '2018',
      description:
        "Premier concert en février 2018. Loïc Emmelin devient chef assistant de Fabrice Pierre pour l'Atelier XX-21 de musique contemporaine au CNSMD de Lyon.",
      order: 2,
    },
    {
      year: '2022',
      description:
        "L'orchestre poursuit son développement avec des programmes de plus en plus ambitieux, interprétant notamment la Simple Symphony de Benjamin Britten.",
      order: 3,
    },
    {
      year: '2023',
      description:
        "Concert de fin de saison à la Cathédrale Saint-Vincent de Chalon-sur-Saône avec un programme autour de Tchaïkovski (Le Lac des cygnes), Saint-Saëns, Moussorgski (Une nuit sur le Mont Chauve) et Offenbach.",
      order: 4,
    },
    {
      year: '2025',
      description:
        "Saison riche avec Shéhérazade de Rimski-Korsakov en février, la Grande Messe en ut mineur de Mozart avec le Chœur Opus 71 en juin, et les Grandes Heures de Cluny en août avec un programme dédié aux musiques pour la danse (Debussy, Prokofiev, Ravel).",
      order: 5,
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
      name: 'Adhérent',
      minAmount: 10,
      description:
        "Devenez membre de l'association et recevez en avant-première les informations sur nos concerts, nos projets et la vie de l'orchestre.",
      ctaText: 'Adhérer',
      ctaLink: 'https://www.helloasso.com/associations/la-chambre-symphonique/adhesions/2025-adhesion-a-la-chambre-symphonique-1',
      highlighted: false,
      order: 1,
    },
    {
      name: 'Donateur',
      minAmount: 50,
      description:
        "Soutenez financièrement l'orchestre et contribuez à la réalisation de nos concerts et de nos actions de médiation. Chaque don compte et permet de faire vivre la musique symphonique.",
      ctaText: 'Faire un don',
      ctaLink: 'https://www.helloasso.com/associations/la-chambre-symphonique',
      highlighted: true,
      order: 2,
    },
    {
      name: 'Mécène',
      minAmount: 500,
      description:
        "Entreprises et particuliers, devenez mécènes de La Chambre Symphonique. Bénéficiez d'une visibilité privilégiée et contribuez au rayonnement de la musique symphonique en Bourgogne et en Rhône-Alpes.",
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
        address: 'Bourgogne — Rhône-Alpes\nFrance',
        email: 'contact@lachambresymphonique.fr',
        phone: '',
      },
      social: {
        facebook: 'https://www.facebook.com/lachambresymphonique',
        instagram: 'https://www.instagram.com/lachambresymphonique/',
        youtube: '#',
        linkedin: 'https://www.linkedin.com/company/la-chambre-symphonique',
        tiktok: '',
      },
      hours: [
        { label: 'Association bénévole', hours: 'Contactez-nous par email' },
      ],
      footerDescription:
        "La Chambre Symphonique est un orchestre fondé en 2017 par Loïc Emmelin, rassemblant plus de 80 musiciens — professionnels, futurs professionnels et amateurs éclairés — autour de la passion du répertoire symphonique.",
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
        subtitle: 'Orchestre symphonique',
        titleLine1: 'La Chambre',
        titleLine2Italic: 'Symphonique',
        description:
          "Plus de 80 musiciens réunis par la passion du répertoire symphonique. Un orchestre jeune et ambitieux, acteur de la vitalité de la musique orchestrale en Bourgogne et en Rhône-Alpes.",
        ctaPrimaryText: 'Prochains concerts',
        ctaPrimaryLink: '#concerts',
        ctaSecondaryText: "Découvrir l'orchestre",
        ctaSecondaryLink: '/a-propos',
      },
      presentation: {
        subtitle: 'Notre histoire',
        title: "Un orchestre au service\nde la musique symphonique",
        paragraphs:
          "Fondée en 2017, La Chambre Symphonique rassemble des étudiants de conservatoires français, suisses et belges, des amateurs éclairés et de jeunes musiciens professionnels qui se retrouvent pour partager leur passion avec le plus grand nombre.\n\nNous avons volontairement voulu ouvrir les portes de l'orchestre à tous ceux qui voulaient jouer et surtout bien jouer. La Chambre Symphonique se veut un acteur de la vitalité de la musique orchestrale, en stimulant le développement et l'exploration du répertoire symphonique à travers un langage musical tourné vers le public, pour que chaque concert soit toujours une rencontre.",
        ctaText: 'En savoir plus',
        ctaLink: '/a-propos',
        signature: '— Loïc Emmelin, Fondateur & Directeur artistique',
      },
      newsletter: {
        subtitle: 'Restez informé',
        title: 'Suivez nos prochains concerts',
        description:
          "Inscrivez-vous à notre lettre d'information pour recevoir en avant-première nos dates de concert, nos actualités et nos projets.",
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
        subtitle: 'Qui sommes-nous',
        title: 'Un orchestre jeune\net ambitieux',
        content:
          "La Chambre Symphonique est un orchestre fondé en 2017 par le chef d'orchestre Loïc Emmelin. Constitué de jeunes musiciens professionnels ou en voie de professionnalisation, l'orchestre est reconnu pour son sérieux, sa joie de vivre et des programmes toujours plus ambitieux.\n\nSelon les œuvres, l'orchestre réunit de 40 à 80 musiciens issus de conservatoires supérieurs ou régionaux de France, de Suisse et de Belgique, d'amateurs éclairés ou de jeunes musiciens professionnels.\n\nInitialement violoniste dans la classe de Martine Lecointre au Conservatoire de Givors, Loïc Emmelin a été initié à la direction d'orchestre par Philippe Fournier, avant de se perfectionner pendant six ans au Conservatoire Régional de Chalon-sur-Saône dans la classe de Philippe Cambreling, puis au Conservatoire Frédéric Chopin de Paris dans la classe d'Adrian McDonnell.\n\nDepuis 2018, il est chef assistant de Fabrice Pierre pour les productions de l'Atelier XX-21 au CNSMD de Lyon, et a été plus récemment chef assistant de Benjamin Levy auprès de l'Orchestre National de Cannes, de l'Ensemble Pelléas et de l'Opéra National de Lyon.",
      },
      stats: [
        { number: '80+', label: 'Musiciens' },
        { number: '7', label: "Années d'existence" },
        { number: '2017', label: 'Année de fondation' },
        { number: '40-80', label: 'Musiciens par concert' },
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
          title: 'Adhérer à l\'association',
          description:
            "Rejoignez l'aventure en devenant membre de La Chambre Symphonique. Votre adhésion soutient directement notre fonctionnement et vous donne accès à l'actualité de l'orchestre en avant-première.",
          ctaText: 'Adhérer sur HelloAsso',
          ctaLink: 'https://www.helloasso.com/associations/la-chambre-symphonique/adhesions/2025-adhesion-a-la-chambre-symphonique-1',
        },
        {
          title: 'Faire un don',
          description:
            "Chaque contribution, quelle que soit sa taille, permet de financer nos concerts, la location de salles, l'achat de partitions et nos actions de médiation. L'association fonctionne grâce au bénévolat et vos dons sont essentiels.",
          ctaText: 'Faire un don',
          ctaLink: 'https://www.helloasso.com/associations/la-chambre-symphonique',
        },
        {
          title: 'Devenir bénévole',
          description:
            "L'association qui régit La Chambre Symphonique repose sur le bénévolat. Rejoignez notre équipe pour l'accueil du public, la logistique des concerts, la communication ou l'organisation d'événements.",
          ctaText: 'Nous contacter',
          ctaLink: '/contact',
        },
      ],
      taxInfo: {
        subtitle: 'Avantage fiscal',
        title: 'Votre don est déductible',
        description:
          "La Chambre Symphonique est une association d'intérêt général. À ce titre, vos dons ouvrent droit à une réduction d'impôt.",
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
