/**
 * Pricing tiers. Edit prices here to roll them across the entire site.
 * Stripe price IDs are picked up from env vars at runtime — set them
 * in your dashboard once products are created.
 */

export type TierId = "standard" | "keepsake";

export interface Tier {
  id: TierId;
  name: string;
  /** Short pitch under the tier name */
  tagline: string;
  /** Whole-dollar amount. */
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
  fulfillment: "standard-7d" | "keepsake-48h";
}

export const TIERS: Tier[] = [
  {
    id: "standard",
    name: "SongSouls Standard",
    tagline: "One song, written from your story.",
    price: 99,
    priceCents: 9900,
    stripePriceEnvVar: "STRIPE_PRICE_STANDARD",
    turnaround: "7-day delivery",
    fulfillment: "standard-7d",
    includes: [
      "One finished song (MP3)",
      "Lyrics displayed on your song page",
      "Written by a songwriter from your intake",
      "AI-assisted vocals and instrumentation",
      "Delivered within 7 days",
    ],
    highlighted: true,
  },
  {
    id: "keepsake",
    name: "SongSouls Keepsake",
    tagline: "Two variations, designed lyrics, faster turnaround.",
    price: 179,
    priceCents: 17900,
    stripePriceEnvVar: "STRIPE_PRICE_KEEPSAKE",
    turnaround: "48-hour rush",
    fulfillment: "keepsake-48h",
    includes: [
      "Two song variations to choose from",
      "Designed lyrics PDF (print-ready)",
      "Extended song length",
      "Written by a songwriter from your intake",
      "AI-assisted vocals and instrumentation",
      "Delivered within 48 hours",
    ],
    footnote: "Best for memorials, weddings, milestone gifts.",
  },
];

export function getTier(id: TierId): Tier | undefined {
  return TIERS.find((t) => t.id === id);
}

/** The tiers shown on the pricing section of the landing page. */
export const VISIBLE_TIERS: TierId[] = ["standard", "keepsake"];
