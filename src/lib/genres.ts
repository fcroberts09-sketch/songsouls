/**
 * The genre/occasion catalog. Each genre defines:
 * - A short name + description for the picker
 * - A musical "flavor" hint passed to the lyric AI
 * - A set of intake questions that change per genre — this is what makes
 *   each song feel personally written, not template-filled.
 */

export type GenreId =
  | "memorial"
  | "anniversary"
  | "birthday"
  | "healing"
  | "parent-child"
  | "friendship"
  | "letter"
  | "just-because";

export interface IntakeQuestion {
  id: string;
  prompt: string;
  /** Helper subtitle shown under the question */
  helper?: string;
  /** Suggested length — soft hint for the textarea */
  rows?: number;
  /** Whether an answer is required to proceed */
  required?: boolean;
}

export interface Genre {
  id: GenreId;
  name: string;
  /** One-line tagline shown on the picker card */
  tagline: string;
  /** Longer description shown after selection */
  description: string;
  /** Musical style hint passed to the lyric model and to Suno later */
  musicalFlavor: string;
  /** Color theme key for the card — maps to Tailwind classes in the UI */
  accent: "rose" | "gold" | "amber" | "indigo" | "plum" | "sky" | "ember" | "moss";
  /** Emoji-free icon path (a single SVG path "d" attribute) */
  iconPath: string;
  /** Is this genre appropriate to default-suggest "for someone who has passed"? */
  isMemorial: boolean;
  /** Default duration the AI should target */
  targetLines: [number, number];
  /** Genre-specific intake questions */
  questions: IntakeQuestion[];
}

const sharedClosingQuestion: IntakeQuestion = {
  id: "anything-else",
  prompt: "Anything else we should know?",
  helper: "Inside jokes, phrases they always said, songs they loved — anything that would make this feel unmistakably theirs.",
  rows: 4,
  required: false,
};

export const GENRES: Genre[] = [
  {
    id: "memorial",
    name: "In Memory",
    tagline: "A song for someone who is no longer here.",
    description:
      "A tender tribute to someone you've lost. We write with care, in your voice, around the details only you know.",
    musicalFlavor:
      "soft acoustic ballad, fingerpicked guitar or piano, warm intimate vocals, gentle strings, 70 bpm, in the spirit of Iron & Wine or Phoebe Bridgers",
    accent: "indigo",
    iconPath: "M12 21s-7-4.5-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 10-7 10z",
    isMemorial: true,
    targetLines: [28, 36],
    questions: [
      {
        id: "their-name",
        prompt: "What was their name, and what did you call them?",
        helper: "First name, nickname, the way only you said it.",
        required: true,
        rows: 2,
      },
      {
        id: "who-they-were",
        prompt: "Who were they to you?",
        helper: "Grandmother, best friend, brother — and the deeper version of that.",
        required: true,
        rows: 3,
      },
      {
        id: "small-detail",
        prompt: "What is one small detail you don't want to forget?",
        helper: "The way they hummed while cooking. The smell of their garage. A phrase. The point of this whole song is right here.",
        required: true,
        rows: 4,
      },
      {
        id: "moment-together",
        prompt: "Is there one moment with them you keep returning to?",
        helper: "Don't worry about being a writer — just describe what happened.",
        required: true,
        rows: 4,
      },
      {
        id: "what-they-gave-you",
        prompt: "What did they give you that you carry now?",
        helper: "A way of seeing the world, a recipe, a stubborn streak, a love.",
        required: true,
        rows: 3,
      },
      {
        id: "what-youd-tell-them",
        prompt: "If they could hear this song, what should it tell them?",
        rows: 3,
      },
      sharedClosingQuestion,
    ],
  },
  {
    id: "anniversary",
    name: "For My Person",
    tagline: "Anniversaries, weddings, the long love.",
    description:
      "A song for the partner who has been beside you. We write specific — not generic — love.",
    musicalFlavor:
      "warm acoustic folk-pop, 90 bpm, soft male or female vocal, light percussion, in the spirit of Gregory Alan Isakov or Sara Bareilles",
    accent: "rose",
    iconPath:
      "M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18z",
    isMemorial: false,
    targetLines: [26, 34],
    questions: [
      {
        id: "their-name",
        prompt: "Their name?",
        required: true,
        rows: 1,
      },
      {
        id: "how-met",
        prompt: "How did you meet?",
        helper: "Where, when, what they were wearing if you remember.",
        required: true,
        rows: 4,
      },
      {
        id: "first-noticed",
        prompt: "What was the first thing you noticed about them?",
        rows: 3,
        required: true,
      },
      {
        id: "ordinary-magic",
        prompt: "Describe an ordinary moment that you secretly love.",
        helper: "Not the wedding, not the trip — the Tuesday morning, the way they make coffee.",
        rows: 4,
        required: true,
      },
      {
        id: "hardest-thing",
        prompt: "What is the hardest thing you've gone through together?",
        helper: "Optional but powerful — love songs land deeper when they include real weather.",
        rows: 4,
      },
      {
        id: "what-they-call-you",
        prompt: "What do they call you when no one else is around?",
        rows: 2,
      },
      sharedClosingQuestion,
    ],
  },
  {
    id: "birthday",
    name: "Happy Birthday",
    tagline: "A milestone song that beats a card.",
    description:
      "For a birthday that deserves more than a candle. We craft a song that's actually about them — not a generic happy-birthday remix.",
    musicalFlavor:
      "uplifting acoustic-pop, 100 bpm, joyful warm vocal, hand-claps and gentle piano, in the spirit of Jack Johnson or Colbie Caillat",
    accent: "gold",
    iconPath:
      "M12 2l1.5 4.5h4.5l-3.6 2.6 1.4 4.4-3.8-2.7-3.8 2.7 1.4-4.4-3.6-2.6h4.5L12 2z",
    isMemorial: false,
    targetLines: [22, 30],
    questions: [
      {
        id: "their-name",
        prompt: "Whose birthday is this?",
        required: true,
        rows: 1,
      },
      {
        id: "milestone",
        prompt: "What birthday is it, and what does it mean?",
        helper: "Turning 30, 50, 80 — or just another year that deserves a song.",
        required: true,
        rows: 2,
      },
      {
        id: "what-makes-them-them",
        prompt: "What makes them them?",
        helper: "The mannerism, the laugh, the thing only their people know.",
        required: true,
        rows: 4,
      },
      {
        id: "year-they-had",
        prompt: "What kind of year did they have?",
        rows: 3,
        required: true,
      },
      {
        id: "wish-for-them",
        prompt: "What do you wish for them in the year ahead?",
        rows: 3,
        required: true,
      },
      sharedClosingQuestion,
    ],
  },
  {
    id: "healing",
    name: "For the Inner Self",
    tagline: "A song for your past self, or the version still healing.",
    description:
      "Used in therapy, journaling, and quiet evenings — a song written for the version of you that needed to hear something. Often co-created with a therapist.",
    musicalFlavor:
      "ambient folk, 65 bpm, breath-quiet vocal, piano and pads, slow build, in the spirit of Bon Iver or Sufjan Stevens",
    accent: "plum",
    iconPath:
      "M12 2a5 5 0 0 0-5 5c0 2.76 2.24 5 5 5s5-2.24 5-5a5 5 0 0 0-5-5zm0 12c-3.31 0-6 2.69-6 6v2h12v-2c0-3.31-2.69-6-6-6z",
    isMemorial: false,
    targetLines: [24, 32],
    questions: [
      {
        id: "version-of-you",
        prompt: "Which version of you is this song for?",
        helper: "The 7-year-old. The one who left. The one who stayed too long. The one finally healing.",
        required: true,
        rows: 3,
      },
      {
        id: "what-they-needed",
        prompt: "What did that version of you need to hear?",
        helper: "Take your time. There is no wrong answer.",
        required: true,
        rows: 5,
      },
      {
        id: "what-they-survived",
        prompt: "What did they survive?",
        helper: "Only share what feels safe. Specifics are not required — feelings are enough.",
        rows: 5,
      },
      {
        id: "where-you-are-now",
        prompt: "Where are you now, and what would you tell them about the future?",
        rows: 5,
        required: true,
      },
      {
        id: "image-or-place",
        prompt: "Is there a place, an object, or an image that holds this story for you?",
        helper: "A bedroom, a song they used to play, a window, a tree. We weave it in.",
        rows: 3,
      },
      sharedClosingQuestion,
    ],
  },
  {
    id: "parent-child",
    name: "Parent & Child",
    tagline: "From a parent to a child, or a child to a parent.",
    description:
      "The bond that shaped you, made musical. For a graduation, a homecoming, a new baby, or a Tuesday where you want them to know.",
    musicalFlavor:
      "warm acoustic ballad, 75 bpm, family-friendly arrangement, harmonies, in the spirit of James Taylor or Brandi Carlile",
    accent: "amber",
    iconPath:
      "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0H5z",
    isMemorial: false,
    targetLines: [26, 34],
    questions: [
      {
        id: "from-to",
        prompt: "Who is this from, and who is it for?",
        helper: "From mom to my son Eli; from a daughter to her father; etc.",
        required: true,
        rows: 2,
      },
      {
        id: "how-old",
        prompt: "How old are they now, and what's happening in their life?",
        rows: 3,
        required: true,
      },
      {
        id: "earliest-memory",
        prompt: "What is your earliest memory of them, or with them?",
        rows: 4,
        required: true,
      },
      {
        id: "thing-only-you-know",
        prompt: "What is something about them that only you know?",
        helper: "A fear they had, a strength they don't see, a quiet thing.",
        rows: 4,
        required: true,
      },
      {
        id: "what-you-want-them-to-keep",
        prompt: "If they only kept one truth from you, what should it be?",
        rows: 3,
        required: true,
      },
      sharedClosingQuestion,
    ],
  },
  {
    id: "friendship",
    name: "For My People",
    tagline: "The chosen family — best friend, sibling, soul friend.",
    description:
      "A song for the friend who became family. The one you'd call at 3 AM. The reason you survived a decade.",
    musicalFlavor:
      "indie-folk anthem, 95 bpm, bright acoustic, sing-along hook, in the spirit of The Lumineers or Mumford & Sons",
    accent: "moss",
    iconPath:
      "M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    isMemorial: false,
    targetLines: [24, 32],
    questions: [
      {
        id: "their-name",
        prompt: "Their name?",
        required: true,
        rows: 1,
      },
      {
        id: "how-long",
        prompt: "How long have you known each other, and how did it start?",
        rows: 3,
        required: true,
      },
      {
        id: "shared-thing",
        prompt: "What's the thing you two share that no one else gets?",
        helper: "An inside joke, a place, a phrase, a recurring trip.",
        rows: 3,
        required: true,
      },
      {
        id: "what-they-pulled-you-through",
        prompt: "What's the hardest thing they pulled you through (or you pulled them through)?",
        rows: 4,
        required: true,
      },
      {
        id: "why-now",
        prompt: "Why this song, and why now?",
        rows: 3,
      },
      sharedClosingQuestion,
    ],
  },
  {
    id: "letter",
    name: "The Letter",
    tagline: "Everything you wish you could say.",
    description:
      "Sometimes we don't have the words. Or we have them but we can't send them. We turn the letter into a song you can keep, or send.",
    musicalFlavor:
      "intimate singer-songwriter, 80 bpm, single voice and acoustic guitar, late-night feel, in the spirit of Damien Rice or Norah Jones",
    accent: "ember",
    iconPath: "M3 8l9 6 9-6M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z",
    isMemorial: false,
    targetLines: [26, 36],
    questions: [
      {
        id: "to-whom",
        prompt: "Who is this letter for?",
        helper: "An estranged parent, an old love, a sibling, a friend you lost touch with — anyone.",
        required: true,
        rows: 2,
      },
      {
        id: "history",
        prompt: "Briefly — what happened between you?",
        helper: "You don't have to perform it. Just tell us the shape.",
        rows: 5,
        required: true,
      },
      {
        id: "what-you-want-them-to-know",
        prompt: "What do you want them to know?",
        helper: "If they only heard one thing, what would it be?",
        rows: 5,
        required: true,
      },
      {
        id: "tone",
        prompt: "What tone do you want — forgiving, honest, angry, peaceful, hopeful?",
        rows: 2,
        required: true,
      },
      sharedClosingQuestion,
    ],
  },
  {
    id: "just-because",
    name: "Just Because",
    tagline: "No occasion needed.",
    description:
      "Sometimes a person deserves a song for being themselves. Pick this if nothing else fits.",
    musicalFlavor:
      "warm versatile acoustic, 85 bpm, conversational vocal — we'll match the mood you describe",
    accent: "sky",
    iconPath:
      "M9 19V6l11-2v13M9 9l11-2",
    isMemorial: false,
    targetLines: [22, 30],
    questions: [
      {
        id: "for-whom",
        prompt: "Who is this for?",
        required: true,
        rows: 2,
      },
      {
        id: "why",
        prompt: "Why did you think of this song today?",
        rows: 4,
        required: true,
      },
      {
        id: "what-they-feel-like",
        prompt: "If they were a season, a song, or a place — what would they be?",
        rows: 3,
      },
      {
        id: "vibe",
        prompt: "What do you want this song to feel like?",
        helper: "Comforting, joyful, melancholy, hopeful, fierce — your call.",
        rows: 3,
        required: true,
      },
      sharedClosingQuestion,
    ],
  },
];

export function getGenre(id: string): Genre | undefined {
  return GENRES.find((g) => g.id === id);
}

/** Color classes for genre accent — keeps Tailwind happy with full class names */
export const ACCENT_CLASSES: Record<
  Genre["accent"],
  { bg: string; ring: string; text: string; gradient: string }
> = {
  rose: {
    bg: "bg-rose-500/10",
    ring: "ring-rose-400/40",
    text: "text-rose-300",
    gradient: "from-rose-400/20 to-rose-700/0",
  },
  gold: {
    bg: "bg-gold-500/10",
    ring: "ring-gold-400/40",
    text: "text-gold-300",
    gradient: "from-gold-400/20 to-gold-700/0",
  },
  amber: {
    bg: "bg-amber-500/10",
    ring: "ring-amber-400/40",
    text: "text-amber-300",
    gradient: "from-amber-400/20 to-amber-700/0",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    ring: "ring-indigo-400/40",
    text: "text-indigo-300",
    gradient: "from-indigo-400/20 to-indigo-700/0",
  },
  plum: {
    bg: "bg-purple-500/10",
    ring: "ring-purple-400/40",
    text: "text-purple-300",
    gradient: "from-purple-400/20 to-purple-700/0",
  },
  sky: {
    bg: "bg-sky-500/10",
    ring: "ring-sky-400/40",
    text: "text-sky-300",
    gradient: "from-sky-400/20 to-sky-700/0",
  },
  ember: {
    bg: "bg-orange-500/10",
    ring: "ring-orange-400/40",
    text: "text-orange-300",
    gradient: "from-orange-400/20 to-orange-700/0",
  },
  moss: {
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-400/40",
    text: "text-emerald-300",
    gradient: "from-emerald-400/20 to-emerald-700/0",
  },
};
