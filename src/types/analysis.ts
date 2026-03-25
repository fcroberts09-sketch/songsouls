export interface Phase {
  name: string;
  grade: string;
  status: "good" | "warning" | "needs_work";
  observation: string;
  key_issue: string | null;
}

export interface Issue {
  issue: string;
  description: string;
  impact: string;
}

export interface Drill {
  name: string;
  targets: string;
  reps: string;
  how_to: string;
  priority: "high" | "medium" | "low";
}

export interface DayPlan {
  day: string;
  focus: string;
  activities: string[];
}

export interface AnalysisResult {
  is_valid_upload?: boolean;
  invalid_reason?: string | null;
  overall_grade: string;
  overall_summary: string;
  pitcher_age_note: string;
  phases: Phase[];
  top_issues: Issue[];
  drills: Drill[];
  weekly_plan: DayPlan[];
  encouragement: string;
}

export interface AnalyzeRequest {
  frames: string[];
}

export interface AnalyzeResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}
