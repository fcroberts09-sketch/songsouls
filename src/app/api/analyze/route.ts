import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT, buildValidatorPrompt } from "@/lib/prompts";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateFrames, sanitizeAnalysis, mergeValidation } from "@/lib/validation";

// ---------------------------------------------------------------------------
// Mock data — returned only in explicit mock mode (ANTHROPIC_API_KEY="mock")
// ---------------------------------------------------------------------------
const MOCK_ANALYSIS = {
  overall_grade: "B+",
  overall_summary: "MOCK MODE — Solid pitching mechanics with good rhythm and arm action. The delivery shows natural athleticism with some areas to refine for improved velocity and command.",
  pitcher_age_note: "Mechanics are age-appropriate. Focus on consistency and building good habits.",
  phases: [
    { name: "Stance & Grip", grade: "A", status: "good" as const, confidence: "high" as const, observation: "Athletic stance with balanced weight distribution. Grip looks comfortable and natural.", key_issue: null },
    { name: "Wind-Up", grade: "B+", status: "good" as const, confidence: "medium" as const, observation: "Smooth tempo with good momentum toward the plate. Slight early shoulder rotation detected.", key_issue: "Minor early shoulder rotation" },
    { name: "Stride", grade: "B", status: "warning" as const, confidence: "medium" as const, observation: "Stride length is slightly short, limiting hip-to-shoulder separation and reducing potential velocity.", key_issue: "Stride length could be longer" },
    { name: "Arm Action", grade: "A-", status: "good" as const, confidence: "high" as const, observation: "Clean arm path with good elbow height at foot strike. Wrist stays behind the ball well.", key_issue: null },
    { name: "Hip Rotation", grade: "B", status: "warning" as const, confidence: "medium" as const, observation: "Hips are firing but not fully clearing before shoulder rotation begins. More separation needed.", key_issue: "Insufficient hip-shoulder separation" },
    { name: "Release Point", grade: "B+", status: "good" as const, confidence: "medium" as const, observation: "Consistent release point out front. Slight drop in release height on some pitches.", key_issue: "Minor release point inconsistency" },
    { name: "Follow-Through", grade: "A-", status: "good" as const, confidence: "high" as const, observation: "Good deceleration with arm finishing across the body. Athletic fielding position maintained.", key_issue: null },
  ],
  top_issues: [
    { issue: "Hip-Shoulder Separation", description: "Shoulders are rotating too early, reducing the elastic energy that transfers from the lower half to the arm.", impact: "Can cost 3-5 mph and reduce pitch movement" },
    { issue: "Stride Length", description: "Stride is approximately 80% of height. Optimal is 85-100% for maximum power generation.", impact: "Limits ground force and hip drive efficiency" },
  ],
  drills: [
    { name: "Hip Hinge & Separation Drill", targets: "Hip-shoulder separation", reps: "3 sets of 10 reps", how_to: "Stand with feet shoulder-width apart. Practice rotating hips fully while keeping shoulders closed.", priority: "high" as const },
    { name: "Towel Drill", targets: "Arm path and release consistency", reps: "3 sets of 15 reps", how_to: "Hold a towel in the throwing hand. Go through full delivery and snap the towel to hit a target.", priority: "medium" as const },
  ],
  weekly_plan: [
    { day: "Monday", focus: "Hip Separation", activities: ["Hip Hinge Drill – 3x10", "Light catch focusing on hip fire"] },
    { day: "Tuesday", focus: "Rest & Recovery", activities: ["Light stretching", "Band work for shoulder maintenance"] },
    { day: "Wednesday", focus: "Stride & Balance", activities: ["Stride Length Markers – 20 reps", "Flat ground bullpen (30 pitches)"] },
    { day: "Thursday", focus: "Arm Action", activities: ["Towel Drill – 3x15", "Long toss (build to 90 feet)"] },
    { day: "Friday", focus: "Full Integration", activities: ["Full bullpen session (45 pitches)", "Film review with coach"] },
    { day: "Saturday", focus: "Competition", activities: ["Apply mechanics in game setting"] },
    { day: "Sunday", focus: "Rest", activities: ["Full rest or light walk"] },
  ],
  encouragement: "MOCK MODE ACTIVE — Enter your Anthropic API key in settings to run real analysis.",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Returns the resolved API key, or null if none is available. */
function resolveApiKey(clientApiKey: unknown): string | null {
  // 1. Client-provided key takes top priority (any sk- prefix accepted)
  if (typeof clientApiKey === "string" && clientApiKey.trim().startsWith("sk-")) {
    return clientApiKey.trim();
  }
  // 2. Server env var
  const serverKey = process.env.ANTHROPIC_API_KEY;
  if (serverKey && serverKey.trim() !== "" && serverKey !== "mock") {
    return serverKey.trim();
  }
  return null;
}

function isExplicitMockMode(): boolean {
  return process.env.ANTHROPIC_API_KEY === "mock";
}

// ---------------------------------------------------------------------------
// Content block types (avoids `source: undefined as never` hack)
// ---------------------------------------------------------------------------
type TextBlock = { type: "text"; text: string };
type ImageBlock = { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } };
type ContentBlock = TextBlock | ImageBlock;

// ---------------------------------------------------------------------------
// POST /api/analyze
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // --- Rate limiting ---
    const ip = getClientIP(request);
    const maxPerMinute = parseInt(process.env.RATE_LIMIT_PER_MINUTE || "10", 10);
    const rateCheck = checkRateLimit(ip, maxPerMinute, 60 * 1000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a minute before trying again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // --- Parse request body FIRST ---
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Request body must be a JSON object" },
        { status: 400 }
      );
    }

    const { frames, clientApiKey } = body as { frames: unknown; clientApiKey?: unknown };

    // --- Resolve API key ---
    const apiKey = resolveApiKey(clientApiKey);

    console.log("[analyze] clientApiKey present:", typeof clientApiKey === "string" && clientApiKey.length > 0);
    console.log("[analyze] apiKey resolved:", apiKey ? "yes (length " + apiKey.length + ")" : "no");
    console.log("[analyze] mock mode:", isExplicitMockMode());

    // --- Mock mode: ONLY when explicitly set AND no real key provided ---
    if (!apiKey && isExplicitMockMode()) {
      await new Promise((r) => setTimeout(r, 1500));
      return NextResponse.json({ success: true, data: MOCK_ANALYSIS });
    }

    // --- No key at all: return clear error ---
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "No API key configured. Click the ⚙ settings icon to add your Anthropic API key.",
        },
        { status: 401 }
      );
    }

    // --- Validate frames ---
    const frameValidation = validateFrames(frames);
    if (!frameValidation.valid) {
      return NextResponse.json(
        { success: false, error: frameValidation.error },
        { status: 400 }
      );
    }

    const validFrames = frames as string[];

    // --- Build content blocks (no type hacks) ---
    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

    const imageContent: ContentBlock[] = validFrames.flatMap((b64, i): ContentBlock[] => [
      {
        type: "text",
        text: `Frame ${i + 1} of ${validFrames.length} (evenly spaced through the pitching delivery):`,
      },
      {
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: b64,
        },
      },
    ]);

    imageContent.push({
      type: "text",
      text: "Analyze these frames from a baseball pitcher's delivery. Evaluate each phase of the mechanics carefully. Provide detailed mechanical analysis, identify the top issues, recommend specific drills to address them, and create a weekly practice plan. Return ONLY valid JSON matching the specified schema.",
    });

    // --- Call Anthropic API ---
    console.log("[analyze] calling Anthropic, model:", model, "frames:", validFrames.length);

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: imageContent }],
      }),
    });

    console.log("[analyze] Anthropic response status:", anthropicResponse.status);

    if (!anthropicResponse.ok) {
      const errorBody = await anthropicResponse.text();
      console.error("[analyze] Anthropic error:", anthropicResponse.status, errorBody);

      if (anthropicResponse.status === 401) {
        return NextResponse.json(
          { success: false, error: "API key rejected by Anthropic. Please check your key in settings." },
          { status: 500 }
        );
      }
      if (anthropicResponse.status === 429) {
        return NextResponse.json(
          { success: false, error: "Anthropic rate limit reached. Please try again in a moment." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { success: false, error: `Analysis service error (${anthropicResponse.status}). Please try again.` },
        { status: 502 }
      );
    }

    const responseData = await anthropicResponse.json();

    // --- Parse AI response ---
    const textBlocks = (responseData.content as ContentBlock[])?.filter((b) => b.type === "text");

    if (!textBlocks || textBlocks.length === 0) {
      console.error("[analyze] No text blocks in Anthropic response");
      return NextResponse.json(
        { success: false, error: "No analysis returned from AI. Please try again." },
        { status: 502 }
      );
    }

    const rawText = textBlocks
      .map((b) => (b as TextBlock).text)
      .join("");

    const cleanText = rawText.replace(/```json\s*|```\s*/g, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanText);
    } catch {
      console.error("[analyze] Failed to parse AI JSON:", cleanText.substring(0, 300));
      return NextResponse.json(
        { success: false, error: "AI returned invalid format. Please try again." },
        { status: 502 }
      );
    }

    // --- Sanitize and validate ---
    const analysis = sanitizeAnalysis(parsed);

    if (!analysis) {
      console.error("[analyze] Analysis failed schema validation");
      return NextResponse.json(
        { success: false, error: "AI response didn't match expected format. Please try again." },
        { status: 502 }
      );
    }

    // --- Reject non-pitching uploads ---
    if (analysis.is_valid_upload === false) {
      const reason = analysis.invalid_reason || "This doesn't appear to be a baseball pitching video.";
      return NextResponse.json(
        { success: false, error: `${reason} Please upload a video of a baseball pitcher.` },
        { status: 400 }
      );
    }

    // --- Dual-pass validator (non-blocking) ---
    let finalAnalysis = analysis;
    try {
      const phaseSummary = analysis.phases
        .map((p) => `${p.name}: ${p.observation}${p.key_issue ? ` (key issue: ${p.key_issue})` : ""}`)
        .join("\n");

      const validatorContent: ContentBlock[] = [
        ...imageContent.filter((c): c is ImageBlock => c.type === "image"),
        { type: "text", text: buildValidatorPrompt(phaseSummary) },
      ];

      const validatorResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1200,
          messages: [{ role: "user", content: validatorContent }],
        }),
      });

      if (validatorResponse.ok) {
        const vData = await validatorResponse.json();
        const vText = (vData.content as ContentBlock[])
          ?.filter((b) => b.type === "text")
          .map((b) => (b as TextBlock).text)
          .join("")
          .replace(/```json\s*|```\s*/g, "")
          .trim();
        if (vText) {
          finalAnalysis = mergeValidation(analysis, JSON.parse(vText));
        }
      }
    } catch {
      // Validator failure is non-blocking
    }

    // --- Return success ---
    return NextResponse.json(
      { success: true, data: finalAnalysis },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateCheck.remaining),
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[analyze] Unhandled error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
