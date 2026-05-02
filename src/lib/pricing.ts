/**
 * Pricing tiers. Edit prices here to roll them across the entire site.
 * Stripe price IDs are picked up from env vars at runtime — set them
 * in your dashboard once products are created.
 */

export type TierId = "preview" | "ai-crafted" | "curated" | "life-album";

export interface Tier {
  id: TierId;
  name: string;
  /** Short pitch under the tier name */
  tagline: string;
  /** Whole-dollar amount. 0 = free. */
  price: number;
  /** Used for Stripe (in cents) */
  priceCents: number;
  /** Stripe price ID env var name — pulled at API route time */
  stripePriceEnvVar?: string;
  /** Turnaround promise */
  turnaround: string;
  /** Bullet points shown on the pricing card */
  includes: string[];
  /** Most popular flag */
  highlighted?: boolean;
  /** Footnote shown below the bullets */
  footnote?: string;
  /** Internal: how to fulfill (drives admin workflow) */
  fulfillment: "instant" | "manual-24h" | "manual-72h" | "manual-weeks";
}

export const TIERS: Tier[] = [
  {
    id: "preview",
    name: "Lyric Preview",
    tagline: "See what's possible — no card required.",
    price: 0,
    priceCents: 0,
    turnaround: "Instant",
    fulfillment: "instant",
    includes: [
      "AI-drafted lyrics from your story",
      "First verse + chorus shown live",
      "Save & email yourself the draft",
      "No audio — lyrics only",
    ],
  },
  {
    id: "ai-crafted",
    name: "AI-Crafted Song",
    tagline: "A finished song you can play tonight.",
    price: 39,
    priceCents: 3900,
    stripePriceEnvVar: "STRIPE_PRICE_AI_CRAFTED",
    turnaround: "24 hours",
    fulfillment: "manual-24h",
    includes: [
      "Full lyrics, refined by our team",
      "Studio audio (vocals + instrumentation)",
      "MP3 + lyric sheet delivered to your inbox",
      "1 free revision request",
    ],
    footnote: "Most popular for birthdays, anniversaries, and just-because.",
    highlighted: true,
  },
  {
    id: "curated",
    name: "Songwriter Curated",
    tagline: "A real songwriter shapes it with you.",
    price: 129,
    priceCents: 12900,
    stripePriceEnvVar: "STRIPE_PRICE_CURATED",
    turnaround: "48–72 hours",
    fulfillment: "manual-72h",
    includes: [
      "Hand-crafted by a SongSouls songwriter",
      "Two studio versions to choose from",
      "Custom musical arrangement & vocal style",
      "Two rounds of revisions",
      "Optional written liner-notes",
    ],
    footnote: "Best for memorials, weddings, and gifts that need to land just right.",
  },
  {
    id: "life-album",
    name: "Life Album",
    tagline: "An 8-song soundtrack of a life.",
    price: 500,
    priceCents: 50000,
    stripePriceEnvVar: "STRIPE_PRICE_LIFE_ALBUM",
    turnaround: "2–3 weeks",
    fulfillment: "manual-weeks",
    includes: [
      "1-on-1 60-min consultation (Zoom or phone)",
      "8 original songs spanning chapters of a life",
      "Cohesive musical arc — listen end-to-end",
      "Custom album cover & liner notes",
      "Digital album + downloadable MP3s",
      "Three rounds of revisions across the album",
    ],
    footnote:
      "Designed for memorials, milestone birthdays (60, 70, 80…), retirement gifts, and once-in-a-lifetime tributes.",
  },
];

export function getTier(id: TierId): Tier | undefined {
  return TIERS.find((t) => t.id === id);
}

/** The tiers shown on the pricing section of the landing page. */
export const VISIBLE_TIERS: TierId[] = ["ai-crafted", "curated", "life-album"];
