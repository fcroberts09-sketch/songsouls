import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeLyrics, stripCodeFences, safeString } from "@/lib/validation";
import { LYRICS_SYSTEM_PROMPT, buildLyricsUserPrompt } from "@/lib/prompts";
import { getGenre } from "@/lib/genres";
import type { GeneratedLyrics } from "@/types/order";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
}

interface LyricsRequestBody {
  genreId?: unknown;
  recipientName?: unknown;
  recipientRelationship?: unknown;
  occasion?: unknown;
  answers?: unknown;
}

interface AnswerInput {
  question: string;
  answer: string;
}

/**
 * Generate a placeholder lyric draft when no API key is configured.
 * Lets the create flow stay functional in dev without an Anthropic key.
 */
function placeholderLyrics(args: {
  genreName: string;
  recipientName: string;
}): GeneratedLyrics {
  return {
    title: "A Song for " + args.recipientName,
    structure: [
      {
        section: "verse_1",
        lines: [
          `(Set ANTHROPIC_API_KEY in .env.local to generate real lyrics.)`,
          `This is a placeholder draft for ${args.recipientName}.`,
          `It's the kind of ${args.genreName.toLowerCase()} song we'll write —`,
          `built from the details you shared, line by line.`,
        ],
      },
      {
        section: "chorus",
        lines: [
          `Your real song will be here in a moment,`,
          `as soon as your API key is set.`,
          `Until then, this is a friendly stand-in,`,
          `to show you how it'll feel to read.`,
        ],
      },
    ],
    suno_prompt:
      "Warm acoustic placeholder, gentle vocal, intimate, 80 bpm — replace with real generation by configuring the Anthropic API key.",
    story_note:
      "This is a placeholder. To generate real lyrics from your story, set the ANTHROPIC_API_KEY environment variable.",
  };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 lyric generations per minute per IP (this is the expensive call)
    const ip = getClientIp(request);
    const rateResult = checkRateLimit(`lyrics:${ip}`, 5, 60_000);
    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `You're generating drafts a bit fast. Try again in ${Math.ceil(rateResult.resetMs / 1000)} seconds.`,
        },
        { status: 429 }
      );
    }

    let body: LyricsRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const genreId = safeString(body.genreId, 50);
    const genre = getGenre(genreId);
    if (!genre) {
      return NextResponse.json(
        { success: false, error: "Unknown genre" },
        { status: 400 }
      );
    }

    const recipientName = safeString(body.recipientName, 80);
    const recipientRelationship = safeString(body.recipientRelationship, 80);
    if (!recipientName) {
      return NextResponse.json(
        { success: false, error: "Recipient name is required" },
        { status: 400 }
      );
    }

    const occasion = safeString(body.occasion, 200);

    const rawAnswers = Array.isArray(body.answers) ? body.answers : [];
    const answers: AnswerInput[] = rawAnswers
      .slice(0, 20)
      .map((a: unknown) => {
        const obj = (a || {}) as Record<string, unknown>;
        return {
          question: safeString(obj.question, 300),
          answer: safeString(obj.answer, 2000),
        };
      })
      .filter((a) => a.question.length > 0);

    // Fallback to placeholder if no API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        data: placeholderLyrics({ genreName: genre.name, recipientName }),
        placeholder: true,
      });
    }

    const userPrompt = buildLyricsUserPrompt({
      genreName: genre.name,
      musicalFlavor: genre.musicalFlavor,
      targetLines: genre.targetLines,
      recipientName,
      recipientRelationship,
      occasion: occasion || undefined,
      answers,
    });

    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

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
      const status = apiRes.status;
      const errBody = await apiRes.text().catch(() => "");
      console.error("[lyrics] Anthropic error", status, errBody);
      const message =
        status === 401
          ? "API key is invalid. Check your ANTHROPIC_API_KEY."
          : status === 429
            ? "Our songwriter is busy at the moment. Try again in a few seconds."
            : "Couldn't reach the songwriter right now. Try again in a moment.";
      return NextResponse.json(
        { success: false, error: message },
        { status: status >= 500 ? 502 : status }
      );
    }

    const result: AnthropicResponse = await apiRes.json();
    const textBlock = result.content?.find((b: AnthropicContentBlock) => b.type === "text");
    if (!textBlock?.text) {
      return NextResponse.json(
        { success: false, error: "No response from songwriter." },
        { status: 502 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripCodeFences(textBlock.text));
    } catch {
      return NextResponse.json(
        { success: false, error: "Couldn't read the draft. Try again." },
        { status: 502 }
      );
    }

    const lyrics = sanitizeLyrics(parsed);
    if (!lyrics) {
      return NextResponse.json(
        { success: false, error: "Draft didn't match the expected shape. Try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data: lyrics });
  } catch (err) {
    console.error("[lyrics] error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
