/**
 * Brand configuration. This is the single source of truth for tone, naming,
 * and core copy. Switching to the roast variant later is as simple as
 * swapping this file (or wrapping it in an env-driven export).
 */

export const brand = {
  name: "SongSouls",
  domain: "songsouls.ai",
  tagline: "The people you love, set to music.",
  promise:
    "Personalized songs — written from your story, performed for the soul that shaped yours.",
  description:
    "SongSouls turns the people, places, and moments that made you into a song you can keep forever. For loved ones lost, partners loved long, children grown, and the version of yourself still finding the words.",
  voice: {
    tone: ["tender", "specific", "premium", "honest", "hopeful"],
    avoid: ["cliché", "saccharine", "transactional", "ironic-distance"],
  },
  contact: {
    email: "hello@songsouls.ai",
    instagram: "@songsouls",
  },
  social: {
    instagram: "https://instagram.com/songsouls",
    tiktok: "https://tiktok.com/@songsouls",
  },
} as const;

export type Brand = typeof brand;
