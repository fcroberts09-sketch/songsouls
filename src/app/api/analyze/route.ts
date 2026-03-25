import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT, buildValidatorPrompt } from "@/lib/prompts";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateFrames, sanitizeAnalysis, mergeValidation } from "@/lib/validation";

const MOCK_ANALYSIS = {
  overall_grade: "B+",
  overall_summary: "Solid pitching mechanics with good rhythm and arm action. The delivery shows natural athleticism with some areas to refine for improved velocity and command.",
  pitcher_age_note: "Mechanics are age-appropriate. Focus on consistency and building good habits.",
  phases: [
    { name: "Stance & Grip", grade: "A", status: "good" as const, observation: "Athletic stance with balanced weight distribution. Grip looks comfortable and natural.", key_issue: null },
    { name: "Wind-Up", grade: "B+", status: "good" as const, observation: "Smooth tempo with good momentum toward the plate. Slight early shoulder rotation detected.", key_issue: "Minor early shoulder rotation" },
    { name: "Stride", grade: "B", status: "warning" as const, observation: "Stride length is slightly short, limiting hip-to-shoulder separation and reducing potential velocity.", key_issue: "Stride length could be longer" },
    { name: "Arm Action", grade: "A-", status: "good" as const, observation: "Clean arm path with good elbow height at foot strike. Wrist stays behind the ball well.", key_issue: null },
    { name: "Hip Rotation", grade: "B", status: "warning" as const, observation: "Hips are firing but not fully clearing before shoulder rotation begins. More separation needed.", key_issue: "Insufficient hip-shoulder separation" },
    { name: "Release Point", grade: "B+", status: "good" as const, observation: "Consistent release point out front. Slight drop in release height on some pitches.", key_issue: "Minor release point inconsistency" },
    { name: "Follow-Through", grade: "A-", status: "good" as const, observation: "Good deceleration with arm finishing across the body. Athletic fielding position maintained.", key_issue: null },
  ],
  top_issues: [
    { issue: "Hip-Shoulder Separation", description: "Shoulders are rotating too early, reducing the elastic energy that transfers from the lower half to the arm.", impact: "Can cost 3-5 mph and reduce pitch movement" },
    { issue: "Stride Length", description: "Stride is approximately 80% of height. Optimal is 85-100% for maximum power generation.", impact: "Limits ground force and hip drive efficiency" },
    { issue: "Early Shoulder Rotation", description: "Front shoulder is opening slightly before front foot plant, causing inconsistent command.", impact: "Leads to elevated pitches and reduced arm-side movement" },
  ],
  drills: [
    { name: "Hip Hinge & Separation Drill", targets: "Hip-shoulder separation", reps: "3 sets of 10 reps", how_to: "Stand with feet shoulder-width apart. Practice rotating hips fully while keeping shoulders closed. Use a resistance band around the waist for feedback.", priority: "high" as const },
    { name: "Stride Length Markers", targets: "Stride length and direction", reps: "20 reps per session", how_to: "Place a tape mark at 90% of your height from the rubber. Practice striding to the mark with balance and control.", priority: "high" as const },
    { name: "Towel Drill", targets: "Arm path and release consistency", reps: "3 sets of 15 reps", how_to: "Hold a towel in the throwing hand. Go through full delivery and snap the towel to hit a target on the wall at release point height.", priority: "medium" as const },
    { name: "Balance Point Hold", targets: "Leg lift and balance", reps: "10 reps, hold 3 seconds each", how_to: "Lift leg to balance point and hold for 3 seconds before beginning the stride. Builds stability and timing.", priority: "medium" as const },
  ],
  weekly_plan: [
    { day: "Monday", focus: "Hip Separation", activities: ["Hip Hinge Drill – 3x10", "Medicine ball rotational throws – 3x8", "Light catch focusing on hip fire"] },
    { day: "Tuesday", focus: "Rest & Recovery", activities: ["Light stretching", "Band work for shoulder maintenance", "Video review of mechanics"] },
    { day: "Wednesday", focus: "Stride & Balance", activities: ["Stride Length Markers – 20 reps", "Balance Point Hold – 10 reps", "Flat ground bullpen (30 pitches, focus on stride)"] },
    { day: "Thursday", focus: "Arm Action", activities: ["Towel Drill – 3x15", "Long toss (build to 90 feet)", "Wrist snap drills"] },
    { day: "Friday", focus: "Full Integration", activities: ["Full bullpen session (45 pitches)", "Film review with coach", "Identify 1 feel cue from session"] },
    { day: "Saturday", focus: "Competition or Scrimmage", activities: ["Apply mechanics in game setting", "Focus on one key cue per inning", "Post-outing notes"] },
    { day: "Sunday", focus: "Rest", activities: ["Full rest or light walk", "Mental visualization of good mechanics", "Prep for next week"] },
  ],
  encouragement: "Great foundation to build on! Your arm action and follow-through are real strengths. With focused work on hip separation and stride length, you have the tools to add velocity and sharpen your command. Keep grinding!",
};

// Validate environment on first request
function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.trim() === "" || key === "sk-ant-xxxxx") {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  return key;
}

function isMockMode(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !key || key.trim() === "" || key === "mock";
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    // --- Rate limiting ---
    const ip = getClientIP(request);
    const maxPerMinute = parseInt(process.env.RATE_LIMIT_PER_MINUTE || "10", 10);
    const rateCheck = checkRateLimit(ip, maxPerMinute, 60 * 1000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please wait a minute before trying again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // --- Parse and validate request body ---
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

    // --- Mock mode: only use if no server key AND no client key provided ---
    // (Must parse body first so we can check for clientApiKey)
    const hasClientKey = typeof clientApiKey === "string" && clientApiKey.startsWith("sk-ant-");
    if (isMockMode() && !hasClientKey) {
      await new Promise((r) => setTimeout(r, 1500)); // simulate processing delay
      return NextResponse.json({ success: true, data: MOCK_ANALYSIS });
    }

    const frameValidation = validateFrames(frames);

    if (!frameValidation.valid) {
      return NextResponse.json(
        { success: false, error: frameValidation.error },
        { status: 400 }
      );
    }

    const validFrames = frames as string[];

    // --- Resolve API key: client-provided takes priority over server env var ---
    let apiKey: string;
    if (clientApiKey && typeof clientApiKey === "string" && clientApiKey.startsWith("sk-ant-")) {
      apiKey = clientApiKey;
    } else if (!isMockMode()) {
      try {
        apiKey = getApiKey();
      } catch {
        return NextResponse.json(
          { success: false, error: "No API key configured. Click the settings icon to add your Anthropic API key." },
          { status: 500 }
        );
      }
    } else {
      // isMockMode already handled above, this path won't be reached
      apiKey = "";
    }

    // --- Build Claude API request ---
    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

    const imageContent = validFrames.flatMap((b64: string, i: number) => [
      {
        type: "text" as const,
        text: `Frame ${i + 1} of ${validFrames.length} (evenly spaced through the pitching delivery):`,
      },
      {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: "image/jpeg" as const,
          data: b64,
        },
      },
    ]);

    imageContent.push({
      type: "text" as const,
      text: "Analyze these frames from a baseball pitcher's delivery. Evaluate each phase of the mechanics carefully. Provide detailed mechanical analysis, identify the top issues, recommend specific drills to address them, and create a weekly practice plan. Return ONLY valid JSON matching the specified schema.",
      source: undefined as never,
    });

    // --- Call Anthropic API ---
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
        messages: [
          {
            role: "user",
            content: imageContent,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorBody = await anthropicResponse.text();
      console.error("Anthropic API error:", anthropicResponse.status, errorBody);

      if (anthropicResponse.status === 401) {
        return NextResponse.json(
          { success: false, error: "API authentication failed. Check your API key." },
          { status: 500 }
        );
      }

      if (anthropicResponse.status === 429) {
        return NextResponse.json(
          { success: false, error: "API rate limit reached. Please try again in a moment." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Analysis service temporarily unavailable. Please try again." },
        { status: 502 }
      );
    }

    const responseData = await anthropicResponse.json();

    // --- Parse AI response ---
    const textBlocks = responseData.content?.filter(
      (block: { type: string }) => block.type === "text"
    );

    if (!textBlocks || textBlocks.length === 0) {
      return NextResponse.json(
        { success: false, error: "No analysis returned from AI. Please try again." },
        { status: 502 }
      );
    }

    const rawText = textBlocks
      .map((block: { text: string }) => block.text)
      .join("");

    // Clean any markdown formatting
    const cleanText = rawText.replace(/```json\s*|```\s*/g, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanText);
    } catch {
      console.error("Failed to parse AI response as JSON:", cleanText.substring(0, 500));
      return NextResponse.json(
        { success: false, error: "AI returned invalid format. Please try again." },
        { status: 502 }
      );
    }

    // --- Sanitize and validate the analysis ---
    const analysis = sanitizeAnalysis(parsed);

    if (!analysis) {
      console.error("Analysis failed schema validation");
      return NextResponse.json(
        { success: false, error: "AI response didn't match expected format. Please try again." },
        { status: 502 }
      );
    }

    // --- Reject non-pitching uploads ---
    if (analysis.is_valid_upload === false) {
      const reason = analysis.invalid_reason || "This doesn't appear to be a baseball pitching video.";
      return NextResponse.json(
        { success: false, error: `Invalid upload: ${reason} Please upload a video of a baseball pitcher.` },
        { status: 400 }
      );
    }

    // --- Dual-pass validator: second Claude call reviews analysis against same frames ---
    let finalAnalysis = analysis;
    try {
      const phaseSummary = analysis.phases
        .map((p) => `${p.name}: ${p.observation}${p.key_issue ? ` (key issue: ${p.key_issue})` : ""}`)
        .join("\n");

      const validatorContent = [
        ...imageContent.filter((c) => c.type === "image"),
        {
          type: "text" as const,
          text: buildValidatorPrompt(phaseSummary),
          source: undefined as never,
        },
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
        const vText = (vData.content as { type: string; text: string }[])
          ?.filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("")
          .replace(/```json\s*|```\s*/g, "")
          .trim();
        if (vText) {
          const vParsed = JSON.parse(vText);
          finalAnalysis = mergeValidation(analysis, vParsed);
        }
      }
    } catch {
      // Validator failure is non-blocking — return the original analysis
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
    console.error("Unhandled error in /api/analyze:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
