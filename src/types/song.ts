/** A song in the public showcase library */
export interface ShowcaseSong {
  slug: string;
  title: string;
  /** Short subtitle, e.g. "For my grandmother, Rose" */
  dedication: string;
  /** Long-form story explaining what inspired the song */
  story: string;
  /** Genre/style label */
  genre: string;
  /** Audio file URL — typically /songs/something.mp3 in /public */
  audioUrl: string;
  /** Cover image — typically /images/something.jpg in /public */
  coverImage?: string;
  /** Cover image alt-text fallback gradient */
  coverGradient?: string;
  /** Lyrics in plain text with line breaks */
  lyrics: string;
  /** Length in mm:ss for display */
  duration: string;
  /** Tier this song was made under */
  tier: "ai-crafted" | "curated" | "life-album";
  /** Timestamp when this song was added (ISO) */
  addedAt: string;
  /** Optional pull-quote from the recipient */
  recipientQuote?: string;
  /** Optional name to attribute the quote to */
  recipientQuoteAuthor?: string;
}
