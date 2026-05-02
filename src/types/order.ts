import type { GenreId } from "@/lib/genres";
import type { TierId } from "@/lib/pricing";

/** Customer-facing order state — for status pages and admin */
export type OrderStatus =
  | "pending_payment"
  | "received"
  | "drafting"
  | "in_review"
  | "delivered"
  | "refunded";

/** Photo metadata captured during intake (data URL or hosted URL) */
export interface UploadedPhoto {
  /** Data URL or hosted URL */
  src: string;
  /** Human-readable label/caption from the customer */
  caption?: string;
  /** Original filename */
  filename?: string;
}

/** A single answer to a dynamic intake question */
export interface IntakeAnswer {
  questionId: string;
  question: string;
  answer: string;
}

/** Generated lyrics structure returned from /api/lyrics */
export interface LyricsSection {
  section:
    | "intro"
    | "verse_1"
    | "verse_2"
    | "verse_3"
    | "chorus"
    | "pre_chorus"
    | "bridge"
    | "outro";
  lines: string[];
}

export interface GeneratedLyrics {
  title: string;
  structure: LyricsSection[];
  suno_prompt: string;
  story_note: string;
}

/** A complete order — what gets emailed to ops + saved to /admin */
export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;

  // Tier & pricing
  tierId: TierId;
  amountCents: number;

  // Customer
  customerEmail: string;
  customerName: string;

  // The song
  genreId: GenreId;
  recipientName: string;
  recipientRelationship: string;
  occasion?: string;
  deliveryDate?: string;

  // Intake
  answers: IntakeAnswer[];
  photos: UploadedPhoto[];

  // AI artifacts
  draftLyrics?: GeneratedLyrics;

  // Notes
  customerNote?: string;
  internalNotes?: string;

  // Stripe
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
}
