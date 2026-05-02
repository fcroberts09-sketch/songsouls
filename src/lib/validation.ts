import type { GeneratedLyrics, LyricsSection } from "@/types/order";

const VALID_SECTIONS: LyricsSection["section"][] = [
  "intro",
  "verse_1",
  "verse_2",
  "verse_3",
  "chorus",
  "pre_chorus",
  "bridge",
  "outro",
];

/** Strip code fences and other formatting the model may add */
export function stripCodeFences(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  return t.trim();
}

/** Validate the AI lyrics response and return a sanitized copy or null. */
export function sanitizeLyrics(data: unknown): GeneratedLyrics | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  if (typeof obj.title !== "string" || obj.title.trim().length === 0) return null;
  if (!Array.isArray(obj.structure) || obj.structure.length === 0) return null;
  if (typeof obj.suno_prompt !== "string") return null;
  if (typeof obj.story_note !== "string") return null;

  const structure: LyricsSection[] = [];
  for (const raw of obj.structure) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const section = VALID_SECTIONS.includes(r.section as LyricsSection["section"])
      ? (r.section as LyricsSection["section"])
      : null;
    if (!section) continue;
    if (!Array.isArray(r.lines)) continue;
    const lines = r.lines.map(String).filter((l) => l.trim().length > 0);
    if (lines.length === 0) continue;
    structure.push({ section, lines });
  }

  if (structure.length === 0) return null;

  return {
    title: obj.title.trim().slice(0, 120),
    structure,
    suno_prompt: obj.suno_prompt.slice(0, 500),
    story_note: obj.story_note.slice(0, 600),
  };
}

/** Validate an email is roughly well-formed */
export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  if (email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Trim & cap a string field. Returns "" if not a string. */
export function safeString(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

/** Validate a photo upload (base64 data URL) */
export function isValidPhotoDataUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (!/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value)) return false;
  // Cap individual photo size at ~6MB base64 (~4.5MB binary)
  return value.length <= 8_000_000;
}

/** Format a section name like "verse_1" → "Verse 1" */
export function formatSectionLabel(section: string): string {
  return section
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
