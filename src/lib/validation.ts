import type { AnalysisResult, Phase, Issue, Drill, DayPlan } from "@/types/analysis";

/** Maximum number of frames accepted */
export const MAX_FRAMES = 12;

/** Minimum number of frames required */
export const MIN_FRAMES = 4;

/** Maximum file size in bytes (50 MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Allowed video MIME types */
export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/x-matroska",
];

/** Base64 character regex */
const BASE64_REGEX = /^[A-Za-z0-9+/]+=*$/;

/**
 * Validate that frames array is well-formed.
 */
export function validateFrames(frames: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(frames)) {
    return { valid: false, error: "frames must be an array" };
  }

  if (frames.length < MIN_FRAMES) {
    return { valid: false, error: `At least ${MIN_FRAMES} frames are required` };
  }

  if (frames.length > MAX_FRAMES) {
    return { valid: false, error: `Maximum ${MAX_FRAMES} frames allowed` };
  }

  for (let i = 0; i < frames.length; i++) {
    if (typeof frames[i] !== "string") {
      return { valid: false, error: `Frame ${i} is not a string` };
    }

    const frame = frames[i] as string;

    // Check reasonable size (each frame should be < 5MB base64)
    if (frame.length > 5 * 1024 * 1024 * 1.37) {
      return { valid: false, error: `Frame ${i} exceeds maximum size` };
    }

    // Basic base64 validation (check first chunk)
    const sample = frame.substring(0, 100).replace(/\s/g, "");
    if (!BASE64_REGEX.test(sample)) {
      return { valid: false, error: `Frame ${i} is not valid base64` };
    }
  }

  return { valid: true };
}

/**
 * Validate a video file on the client side.
 */
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (!ALLOWED_VIDEO_TYPES.includes(file.type) && !file.type.startsWith("video/")) {
    return { valid: false, error: "File must be a video (MP4, MOV, WebM, AVI, or MKV)" };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = Math.round(file.size / (1024 * 1024));
    return { valid: false, error: `File is ${sizeMB}MB — maximum is 50MB` };
  }

  if (file.size < 1000) {
    return { valid: false, error: "File appears to be empty or corrupt" };
  }

  return { valid: true };
}

/**
 * Validate and sanitize the AI analysis response.
 * Returns a clean AnalysisResult or null if invalid.
 */
export function sanitizeAnalysis(raw: unknown): AnalysisResult | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Record<string, unknown>;

  // Required top-level fields
  if (typeof data.overall_grade !== "string") return null;
  if (typeof data.overall_summary !== "string") return null;

  // Validate grade format
  const gradeRegex = /^[A-D][+-]?$/;
  if (!gradeRegex.test(data.overall_grade)) return null;

  // Validate phases
  if (!Array.isArray(data.phases) || data.phases.length === 0) return null;

  const validStatuses = ["good", "warning", "needs_work"];
  const phases: Phase[] = [];

  for (const p of data.phases) {
    if (!p || typeof p !== "object") continue;
    const phase = p as Record<string, unknown>;

    if (typeof phase.name !== "string") continue;
    if (typeof phase.grade !== "string") continue;
    if (typeof phase.status !== "string" || !validStatuses.includes(phase.status)) continue;
    if (typeof phase.observation !== "string") continue;

    phases.push({
      name: String(phase.name).slice(0, 200),
      grade: String(phase.grade).slice(0, 5),
      status: phase.status as Phase["status"],
      observation: String(phase.observation).slice(0, 500),
      key_issue: phase.key_issue != null ? String(phase.key_issue).slice(0, 300) : null,
    });
  }

  if (phases.length === 0) return null;

  // Validate issues
  const issues: Issue[] = [];
  if (Array.isArray(data.top_issues)) {
    for (const iss of data.top_issues) {
      if (!iss || typeof iss !== "object") continue;
      const issue = iss as Record<string, unknown>;
      if (typeof issue.issue !== "string") continue;

      issues.push({
        issue: String(issue.issue).slice(0, 200),
        description: String(issue.description || "").slice(0, 500),
        impact: String(issue.impact || "").slice(0, 500),
      });
    }
  }

  // Validate drills
  const validPriorities = ["high", "medium", "low"];
  const drills: Drill[] = [];
  if (Array.isArray(data.drills)) {
    for (const d of data.drills) {
      if (!d || typeof d !== "object") continue;
      const drill = d as Record<string, unknown>;
      if (typeof drill.name !== "string") continue;

      drills.push({
        name: String(drill.name).slice(0, 200),
        targets: String(drill.targets || "").slice(0, 300),
        reps: String(drill.reps || "").slice(0, 200),
        how_to: String(drill.how_to || "").slice(0, 1000),
        priority: validPriorities.includes(String(drill.priority))
          ? (String(drill.priority) as Drill["priority"])
          : "medium",
      });
    }
  }

  // Validate weekly plan
  const weeklyPlan: DayPlan[] = [];
  if (Array.isArray(data.weekly_plan)) {
    for (const dp of data.weekly_plan) {
      if (!dp || typeof dp !== "object") continue;
      const day = dp as Record<string, unknown>;
      if (typeof day.day !== "string") continue;

      weeklyPlan.push({
        day: String(day.day).slice(0, 100),
        focus: String(day.focus || "").slice(0, 200),
        activities: Array.isArray(day.activities)
          ? day.activities.filter((a): a is string => typeof a === "string").map((a) => a.slice(0, 300))
          : [],
      });
    }
  }

  return {
    is_valid_upload: data.is_valid_upload !== false,
    invalid_reason: data.invalid_reason != null ? String(data.invalid_reason).slice(0, 300) : null,
    overall_grade: String(data.overall_grade).slice(0, 5),
    overall_summary: String(data.overall_summary).slice(0, 1000),
    pitcher_age_note: String(data.pitcher_age_note || "").slice(0, 500),
    phases,
    top_issues: issues,
    drills,
    weekly_plan: weeklyPlan,
    encouragement: String(data.encouragement || "").slice(0, 500),
  };
}
