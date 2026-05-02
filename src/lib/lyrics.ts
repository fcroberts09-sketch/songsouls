import { sanitizeLyrics, stripCodeFences } from "@/lib/validation";
import { LYRICS_SYSTEM_PROMPT, buildLyricsUserPrompt } from "@/lib/prompts";
import { getGenre } from "@/lib/genres";
import type { GeneratedLyrics, IntakeAnswer } from "@/types/order";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-opus-4-7";

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
}

export interface GenerateLyricsInput {
  genreId: string;
  recipientName: string;
  recipientRelationship: string;
  occasion?: string;
  answers: IntakeAnswer[];
}

export async function generateLyrics(
  input: GenerateLyricsInput
): Promise<GeneratedLyrics | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const genre = getGenre(input.genreId);
  if (!genre) return null;

  const userPrompt = buildLyricsUserPrompt({
    genreName: genre.name,
    musicalFlavor: genre.musicalFlavor,
    targetLines: genre.targetLines,
    recipientName: input.recipientName,
    recipientRelationship: input.recipientRelationship,
    occasion: input.occasion,
    answers: input.answers.map((a) => ({
      question: a.question,
      answer: a.answer,
    })),
  });

  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const apiRes = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: LYRICS_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!apiRes.ok) {
    const errBody = await apiRes.text().catch(() => "");
    console.error("[lyrics] Anthropic error", apiRes.status, errBody);
    return null;
  }

  const result: AnthropicResponse = await apiRes.json();
  const textBlock = result.content?.find((b) => b.type === "text");
  if (!textBlock?.text) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFences(textBlock.text));
  } catch {
    return null;
  }

  return sanitizeLyrics(parsed);
}
