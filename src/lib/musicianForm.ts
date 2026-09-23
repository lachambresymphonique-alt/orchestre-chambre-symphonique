/**
 * Formulaire musiciens — catalogue des questions et résolution de la
 * configuration éditée dans l'admin (global « Formulaire musiciens »).
 *
 * Le formulaire public (`src/components/MusicianSubmissionForm.tsx`) et la
 * route qui reçoit les envois (`src/app/api/musician-submissions/route.ts`)
 * lisent tous les deux la configuration à travers `resolveMusicianForm` : ce
 * qui n'est pas demandé n'est ni affiché, ni accepté.
 *
 * Chaque question correspond à un champ existant de la collection
 * « Fiches musiciens reçues ». On peut donc changer le libellé d'une question,
 * son aide, son exemple, la rendre obligatoire, la retirer ou la remettre —
 * mais pas inventer une question qui n'aurait nulle part où être rangée.
 *
 * Quatre questions ne peuvent pas être retirées : prénom, nom, e-mail et rôle.
 * La collection les exige pour créer une fiche. Leur libellé reste modifiable.
 *
 * Ce fichier est aussi chargé par l'admin (conditions d'affichage, étiquettes
 * de lignes) : il ne doit donc dépendre de rien — ni de Payload, ni de Node.
 */

// ─── Catalogue des questions ─────────────────────────────────────────────────

/** Nature d'une question, qui détermine le champ affiché. */
export type QuestionKind = 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'section' | 'photo';

export type FieldKey =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'role'
  | 'instrument'
  | 'section'
  | 'bio'
  | 'inspiringSymphony'
  | 'favoriteWork'
  | 'favoriteComposer'
  | 'formation'
  | 'concours'
  | 'photo'
  | 'videoUrl'
  | 'instagram';

export type QuestionWidth = 'full' | 'half';

type CatalogueEntry = {
  key: FieldKey;
  kind: QuestionKind;
  /** Nom du champ tel qu'il apparaît dans la liste déroulante de l'admin. */
  adminLabel: string;
  label: string;
  hint: string;
  placeholder: string;
  width: QuestionWidth;
  /** Hauteur des zones de texte. */
  rows?: number;
  /** Indispensable à la création d'une fiche : ni retirable, ni facultative. */
  core?: true;
  /** Obligatoire par défaut lorsque la question est remise. */
  required?: boolean;
  autoComplete?: string;
};

/**
 * Toutes les questions possibles, dans l'ordre où elles sont proposées dans
 * l'admin. Les valeurs par défaut reprennent mot pour mot le formulaire
 * d'origine : sans configuration enregistrée, rien ne change pour le visiteur.
 */
export const FIELD_CATALOGUE: readonly CatalogueEntry[] = [
  {
    key: 'firstName',
    kind: 'text',
    adminLabel: 'Prénom',
    label: 'Prénom',
    hint: '',
    placeholder: '',
    width: 'half',
    core: true,
    autoComplete: 'given-name',
  },
  {
    key: 'lastName',
    kind: 'text',
    adminLabel: 'Nom',
    label: 'Nom',
    hint: '',
    placeholder: '',
    width: 'half',
    core: true,
    autoComplete: 'family-name',
  },
  {
    key: 'email',
    kind: 'email',
    adminLabel: 'E-mail',
    label: 'E-mail',
    hint: 'Privé — pour vous joindre, jamais affiché.',
    placeholder: '',
    width: 'half',
    core: true,
    autoComplete: 'email',
  },
  {
    key: 'phone',
    kind: 'tel',
    adminLabel: 'Téléphone',
    label: 'Téléphone',
    hint: 'Privé — pour vous joindre rapidement.',
    placeholder: '06 12 34 56 78',
    width: 'half',
    autoComplete: 'tel',
  },
  {
    key: 'role',
    kind: 'text',
    adminLabel: 'Rôle / fonction',
    label: 'Rôle / fonction',
    hint: '',
    placeholder: 'Violoniste · Cheffe de pupitre · Premier hautbois…',
    width: 'half',
    core: true,
  },
  {
    key: 'instrument',
    kind: 'text',
    adminLabel: 'Instrument',
    label: 'Instrument',
    hint: '',
    placeholder: 'Violon · Hautbois · Piano…',
    width: 'half',
  },
  {
    key: 'section',
    kind: 'section',
    adminLabel: 'Section (pupitre)',
    label: 'Section',
    hint: '',
    placeholder: '',
    width: 'full',
  },
  {
    key: 'bio',
    kind: 'textarea',
    adminLabel: 'Biographie',
    label: 'Biographie',
    hint: '',
    placeholder: 'Quelques paragraphes : parcours, répertoire favori, projets en cours…',
    width: 'full',
    rows: 6,
  },
  {
    key: 'inspiringSymphony',
    kind: 'text',
    adminLabel: 'Symphonie qui a donné envie de faire de la musique',
    label: 'La symphonie qui t’a donné envie de faire de la musique',
    hint: '',
    placeholder: 'Ex : 9ᵉ symphonie de Beethoven, Symphonie fantastique de Berlioz…',
    width: 'full',
  },
  {
    key: 'favoriteWork',
    kind: 'text',
    adminLabel: 'Œuvre préférée',
    label: 'L’œuvre que tu préfères',
    hint: '',
    placeholder: 'Ex : Concerto pour violon op. 35, Le Sacre du printemps…',
    width: 'full',
  },
  {
    key: 'favoriteComposer',
    kind: 'text',
    adminLabel: 'Compositeur préféré',
    label: 'Compositeur',
    hint: '',
    placeholder: 'Ex : Brahms, Ravel, Chostakovitch…',
    width: 'full',
  },
  {
    key: 'formation',
    kind: 'textarea',
    adminLabel: 'Formation',
    label: 'Formation',
    hint: '',
    placeholder: 'CNSMD de Lyon, 2018\nMaster class avec Anne-Sophie Mutter, 2020',
    width: 'full',
    rows: 4,
  },
  {
    key: 'concours',
    kind: 'textarea',
    adminLabel: 'Concours et distinctions',
    label: 'Concours et distinctions',
    hint: '',
    placeholder:
      'Premier prix, Concours Long-Thibaud, 2019\nFinaliste, Concours Reine Elisabeth, 2021',
    width: 'full',
    rows: 4,
  },
  {
    key: 'photo',
    kind: 'photo',
    adminLabel: 'Portrait (photo à téléverser)',
    label: 'Portrait',
    hint: 'JPG, PNG ou WebP — 10 Mo max.',
    placeholder: 'Déposez votre portrait',
    width: 'full',
  },
  {
    key: 'videoUrl',
    kind: 'url',
    adminLabel: 'Lien vidéo',
    label: 'Lien vidéo',
    hint: 'Une captation publique, YouTube ou Vimeo.',
    placeholder: 'https://youtu.be/… · https://vimeo.com/…',
    width: 'full',
  },
  {
    key: 'instagram',
    kind: 'text',
    adminLabel: 'Instagram',
    label: 'Instagram',
    hint: 'Si vous souhaitez le partager — c’est principalement sur Instagram que nous mettons en avant les musiciens.',
    placeholder: '@votre_compte',
    width: 'full',
  },
] as const;

const CATALOGUE_BY_KEY = new Map<string, CatalogueEntry>(
  FIELD_CATALOGUE.map((entry) => [entry.key, entry]),
);

/** Questions que l'on ne peut ni retirer ni rendre facultatives. */
export const CORE_FIELDS: readonly FieldKey[] = FIELD_CATALOGUE.filter((f) => f.core).map(
  (f) => f.key,
);

export function isCoreField(key: unknown): boolean {
  return typeof key === 'string' && (CORE_FIELDS as readonly string[]).includes(key);
}

/** Libellé d'une question dans l'admin (liste déroulante, étiquettes de ligne). */
export function fieldAdminLabel(key: unknown): string {
  return (typeof key === 'string' && CATALOGUE_BY_KEY.get(key)?.adminLabel) || '';
}

/** Champs texte enregistrés tels quels, pour les garde-fous de longueur. */
export const TEXT_FIELD_KEYS: readonly FieldKey[] = FIELD_CATALOGUE.filter(
  (f) => f.kind !== 'photo' && f.kind !== 'section',
).map((f) => f.key);

// ─── Sections (pupitres) ─────────────────────────────────────────────────────

/**
 * Pupitres acceptés. Ce sont les valeurs de la collection Musiciens : en
 * proposer d'autres empêcherait de recopier la fiche. Le libellé affiché sur
 * le formulaire, lui, se modifie librement.
 */
export const SECTION_VALUES = ['cordes', 'vents', 'claviers', 'direction'] as const;
export type SectionValue = (typeof SECTION_VALUES)[number];

export const SECTION_DEFAULT_LABELS: Record<SectionValue, string> = {
  cordes: 'Cordes',
  vents: 'Vents',
  claviers: 'Claviers & percussions',
  direction: 'Direction artistique',
};

export function isSectionValue(value: unknown): value is SectionValue {
  return typeof value === 'string' && (SECTION_VALUES as readonly string[]).includes(value);
}

export const DEFAULT_UNDECIDED_LABEL = 'Je laisse l’équipe décider';

// ─── Forme résolue, donnée au formulaire et à la route d'envoi ───────────────

export type SectionChoice = { value: SectionValue; label: string };

export type ResolvedQuestion = {
  key: FieldKey;
  kind: QuestionKind;
  label: string;
  hint: string;
  placeholder: string;
  required: boolean;
  width: QuestionWidth;
  rows?: number;
  autoComplete?: string;
  /** Questions de type « section » uniquement. */
  choices?: SectionChoice[];
  /** Libellé du choix « sans préférence », ou null s'il n'est pas proposé. */
  undecidedLabel?: string | null;
};

export type ResolvedPart = {
  title: string;
  lede: string;
  questions: ResolvedQuestion[];
};

export type ResolvedMusicianForm = {
  header: { eyebrow: string; titleItalic: string; titleRest: string };
  parts: ResolvedPart[];
  outro: { line: string; submitLabel: string; fallback: string; fallbackLinkLabel: string };
  success: { eyebrow: string; title: string; titleItalic: string; body: string };
  seo: { metaTitle: string; metaDescription: string };
};

// ─── Valeurs par défaut (le formulaire d'origine, à l'identique) ─────────────

export const DEFAULT_HEADER = {
  eyebrow: 'À l’attention des musiciens',
  titleItalic: 'Votre fiche',
  titleRest: 'sur le site.',
};

export const DEFAULT_OUTRO = {
  line: 'Nous lisons chaque envoi à la main.',
  submitLabel: 'Envoyer ma fiche',
  fallback: 'Bloqué ?',
  fallbackLinkLabel: 'Écrivez-nous',
};

export const DEFAULT_SUCCESS = {
  eyebrow: 'Bien reçu',
  titleItalic: 'Merci',
  title: 'pour votre fiche.',
  body:
    'Vos informations viennent d’arriver à l’équipe. Votre fiche paraîtra sur la page Musiciens dès qu’elle aura été relue et validée. Si nous avons besoin d’une précision, nous vous écrirons à l’adresse que vous avez indiquée.',
};

export const DEFAULT_SEO = {
  metaTitle: 'Compléter ma fiche musicien — La Chambre Symphonique',
  metaDescription:
    'Formulaire à destination des musiciens de l’orchestre pour transmettre leur biographie, leur formation et leurs liens vidéo.',
};

type DefaultPart = { title: string; lede: string; keys: FieldKey[] };

/** Les quatre « actes » du formulaire d'origine. */
export const DEFAULT_PARTS: readonly DefaultPart[] = [
  {
    title: 'L’essentiel',
    lede: 'Trois champs suffisent pour ouvrir une fiche. Le reste se complète à votre rythme.',
    keys: ['firstName', 'lastName', 'email', 'phone', 'role', 'instrument', 'section'],
  },
  {
    title: 'À propos de vous',
    lede: 'Ce que vous diriez si on vous tendait le micro pendant l’entracte. On peut tout retravailler ensemble.',
    keys: ['bio', 'inspiringSymphony', 'favoriteWork', 'favoriteComposer'],
  },
  {
    title: 'Votre parcours',
    lede: 'Une ligne par entrée. Inutile d’être exhaustif — choisissez ce qui compte pour vous aujourd’hui.',
    keys: ['formation', 'concours'],
  },
  {
    title: 'Image & son',
    lede: 'Un portrait, une captation. On retravaillera la photo au tirage du site si nécessaire.',
    keys: ['photo', 'videoUrl', 'instagram'],
  },
] as const;

/** Valeur initiale du tableau « Parties du formulaire » dans l'admin. */
export function defaultPartsValue() {
  return DEFAULT_PARTS.map((part) => ({
    title: part.title,
    lede: part.lede,
    questions: part.keys.map((key) => {
      const entry = CATALOGUE_BY_KEY.get(key) as CatalogueEntry;
      return {
        field: key,
        label: entry.label,
        hint: entry.hint,
        placeholder: entry.placeholder,
        width: entry.width,
        required: Boolean(entry.core || entry.required),
        ...(entry.kind === 'section'
          ? {
              sectionChoices: SECTION_VALUES.map((value) => ({
                value,
                label: SECTION_DEFAULT_LABELS[value],
              })),
              // Choix retiré par défaut : une fiche sans pupitre est difficile à classer.
              undecidedEnabled: false,
              undecidedLabel: DEFAULT_UNDECIDED_LABEL,
            }
          : {}),
      };
    }),
  }));
}

// ─── Résolution ──────────────────────────────────────────────────────────────

const text = (value: unknown, fallback = ''): string => {
  const raw = typeof value === 'string' ? value.trim() : '';
  return raw || fallback;
};

function resolveQuestion(row: unknown, seen: Set<string>): ResolvedQuestion | null {
  const data = (row ?? {}) as Record<string, unknown>;
  const key = typeof data.field === 'string' ? data.field : '';
  const entry = CATALOGUE_BY_KEY.get(key);
  // Question inconnue (champ supprimé du code) ou déjà posée plus haut.
  if (!entry || seen.has(key)) return null;
  seen.add(key);

  const question: ResolvedQuestion = {
    key: entry.key,
    kind: entry.kind,
    label: text(data.label, entry.label),
    hint: text(data.hint, ''),
    placeholder: text(data.placeholder, ''),
    // Les questions indispensables restent obligatoires quoi qu'il arrive.
    required: entry.core ? true : data.required === true,
    width: data.width === 'half' || data.width === 'full' ? data.width : entry.width,
    rows: entry.rows,
    autoComplete: entry.autoComplete,
  };

  if (entry.kind === 'section') {
    const rawChoices = Array.isArray(data.sectionChoices) ? data.sectionChoices : [];
    const chosen: SectionChoice[] = [];
    const seenChoices = new Set<string>();
    for (const choice of rawChoices) {
      const c = (choice ?? {}) as Record<string, unknown>;
      if (!isSectionValue(c.value) || seenChoices.has(c.value)) continue;
      seenChoices.add(c.value);
      chosen.push({ value: c.value, label: text(c.label, SECTION_DEFAULT_LABELS[c.value]) });
    }
    question.choices =
      chosen.length > 0
        ? chosen
        : SECTION_VALUES.map((value) => ({ value, label: SECTION_DEFAULT_LABELS[value] }));
    question.undecidedLabel =
      data.undecidedEnabled === true ? text(data.undecidedLabel, DEFAULT_UNDECIDED_LABEL) : null;
  }

  return question;
}

/**
 * Configuration complète du formulaire à partir du global, avec repli sur les
 * valeurs d'origine. Ne renvoie jamais un formulaire inutilisable : si les
 * questions indispensables manquent, elles sont rétablies en tête.
 */
export function resolveMusicianForm(global: unknown): ResolvedMusicianForm {
  const raw = (global ?? {}) as Record<string, unknown>;
  /** Sous-groupe du global, toujours sous forme d'objet lisible. */
  const group = (key: string): Record<string, unknown> => {
    const value = raw[key];
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  };

  const head = group('header');
  const header = {
    eyebrow: text(head.eyebrow, DEFAULT_HEADER.eyebrow),
    titleItalic: text(head.titleItalic, DEFAULT_HEADER.titleItalic),
    titleRest: text(head.titleRest, DEFAULT_HEADER.titleRest),
  };

  const seen = new Set<string>();
  const rawParts = Array.isArray(raw.parts) ? raw.parts : [];
  let parts: ResolvedPart[] = rawParts
    .map((part: unknown, index: number) => {
      const p = (part ?? {}) as Record<string, unknown>;
      const fallback = DEFAULT_PARTS[index];
      const questions = (Array.isArray(p.questions) ? p.questions : [])
        .map((row) => resolveQuestion(row, seen))
        .filter((q): q is ResolvedQuestion => q !== null);
      return {
        title: text(p.title, fallback?.title ?? ''),
        lede: text(p.lede, ''),
        questions,
      };
    })
    // Une partie sans question n'a rien à afficher.
    .filter((part: ResolvedPart) => part.questions.length > 0);

  // Jamais enregistré, ou tout vidé : on repart du formulaire d'origine.
  if (parts.length === 0) {
    seen.clear();
    parts = defaultPartsValue().map((part) => ({
      title: part.title,
      lede: part.lede,
      questions: part.questions
        .map((row) => resolveQuestion(row, seen))
        .filter((q): q is ResolvedQuestion => q !== null),
    }));
  }

  // Filet de sécurité : les questions indispensables sont toujours posées.
  const missing = CORE_FIELDS.filter((key) => !seen.has(key));
  if (missing.length > 0) {
    const restored = missing
      .map((key) => resolveQuestion({ field: key }, seen))
      .filter((q): q is ResolvedQuestion => q !== null);
    parts[0] = { ...parts[0], questions: [...restored, ...parts[0].questions] };
  }

  return {
    header,
    parts,
    outro: {
      line: text(group('outro').line, DEFAULT_OUTRO.line),
      submitLabel: text(group('outro').submitLabel, DEFAULT_OUTRO.submitLabel),
      fallback: text(group('outro').fallback, DEFAULT_OUTRO.fallback),
      fallbackLinkLabel: text(group('outro').fallbackLinkLabel, DEFAULT_OUTRO.fallbackLinkLabel),
    },
    success: {
      eyebrow: text(group('success').eyebrow, DEFAULT_SUCCESS.eyebrow),
      titleItalic: text(group('success').titleItalic, DEFAULT_SUCCESS.titleItalic),
      title: text(group('success').title, DEFAULT_SUCCESS.title),
      body: text(group('success').body, DEFAULT_SUCCESS.body),
    },
    seo: {
      metaTitle: text(group('seo').metaTitle, DEFAULT_SEO.metaTitle),
      metaDescription: text(group('seo').metaDescription, DEFAULT_SEO.metaDescription),
    },
  };
}

/** Toutes les questions posées, dans l'ordre, à plat. */
export function allQuestions(form: ResolvedMusicianForm): ResolvedQuestion[] {
  return form.parts.flatMap((part) => part.questions);
}

/** Question posée pour ce champ, ou undefined si elle a été retirée. */
export function findQuestion(
  form: ResolvedMusicianForm,
  key: FieldKey,
): ResolvedQuestion | undefined {
  return allQuestions(form).find((q) => q.key === key);
}

// ─── Mise en page : regrouper les demi-largeurs deux par deux ────────────────

export type QuestionRow = ResolvedQuestion[];

/**
 * Découpe les questions d'une partie en rangées : deux demi-largeurs côte à
 * côte, tout le reste sur une ligne. Une demi-largeur sans voisine passe en
 * pleine largeur plutôt que de laisser un vide.
 */
export function layoutQuestions(questions: ResolvedQuestion[]): QuestionRow[] {
  const rows: QuestionRow[] = [];
  for (let i = 0; i < questions.length; i += 1) {
    const question = questions[i];
    const next = questions[i + 1];
    if (question.width === 'half' && next?.width === 'half') {
      rows.push([question, next]);
      i += 1;
    } else {
      rows.push([question]);
    }
  }
  return rows;
}
