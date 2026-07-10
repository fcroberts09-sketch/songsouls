/**
 * // SEAM: submissionService — real UCDP / EAD submission. Out of scope for
 * v1; the interface exists so the export view can be wired later without
 * UI changes.
 */
import type { PackageManifest } from "./exportService";

export interface SubmissionResult {
  status: "accepted" | "rejected";
  ssrId?: string;
  messages: string[];
}

export interface SubmissionService {
  submitToUcdp(pkg: PackageManifest): Promise<SubmissionResult>;
}

class MockSubmissionService implements SubmissionService {
  async submitToUcdp(): Promise<SubmissionResult> {
    throw new Error("UCDP submission is not wired in v1. // SEAM: submissionService");
  }
}

export const submissionService: SubmissionService = new MockSubmissionService();
