/**
 * UAD 3.6-native domain model.
 *
 * The report is a single dataset whose rendered sections are *derived* from
 * subject + assignment characteristics (dynamic URAR) — never from a form number.
 * Every machine-populated field carries Provenance; every AI output is an
 * AISuggestion until a human accepts it; audit[] is append-only.
 */

// ---------------------------------------------------------------- users/tenancy

export type Role = "Appraiser" | "Trainee" | "Supervisor" | "OrgAdmin";

export interface User {
  id: string;
  name: string;
  role: Role;
  licenseNumber?: string;
  tenantId: string;
  /** Trainees route work to this supervisor for sign-off (USPAP supervision). */
  supervisorId?: string;
}

export interface Tenant {
  id: string;
  name: string;
}

// ---------------------------------------------------------------- provenance

export type ProvenanceSource =
  | "PublicRecord"
  | "MLS"
  | "AI"
  | "Appraiser"
  | "Inspection";

export interface Provenance {
  source: ProvenanceSource;
  /** ISO timestamp of when the value was set. */
  timestamp: string;
  /** 0..1, only meaningful for machine sources. */
  confidence?: number;
  /** Free-form detail, e.g. "County assessor roll 2025". */
  detail?: string;
}

/** A field value plus where it came from. null value = not yet entered. */
export interface Sourced<T> {
  value: T | null;
  provenance: Provenance | null;
}

export function sourced<T>(value: T, provenance: Provenance): Sourced<T> {
  return { value, provenance };
}

export function emptyField<T>(): Sourced<T> {
  return { value: null, provenance: null };
}

// ---------------------------------------------------------------- assignment

export type PropertyType =
  | "SFR"
  | "Condo"
  | "TwoToFourUnit"
  | "Manufactured"
  | "Coop";

export type AssignmentType = "Purchase" | "Refinance";

export type OrderStatus =
  | "New"
  | "Inspected"
  | "In Report"
  | "QC"
  | "Ready"
  | "Delivered";

export interface Assignment {
  id: string;
  client: string;
  clientType: "Lender" | "AMC";
  intendedUse: string;
  intendedUser: string;
  assignmentType: AssignmentType;
  /** Purchase only. */
  contractPrice: number | null;
  /** Effective date of value (inspection date). */
  effectiveDate: string | null;
  orderedDate: string;
  dueDate: string;
  /** Derived from subject characteristics — the dynamic-URAR variant label. */
  productVariant: string;
  assignedTo: string; // userId
  status: OrderStatus;
  fee: number;
}

// ---------------------------------------------------------------- subject

export type ConditionRating = "C1" | "C2" | "C3" | "C4" | "C5" | "C6";
export type QualityRating = "Q1" | "Q2" | "Q3" | "Q4" | "Q5" | "Q6";

export interface SketchLevel {
  name: string;
  areaSqFt: number;
  belowGrade: boolean;
}

/**
 * Subject characteristics. Every machine-populatable field is Sourced<>.
 * propertyType lives here un-sourced because it is the appraiser's scoping
 * decision and drives which dynamic-URAR sections render.
 */
export interface SubjectProperty {
  propertyType: PropertyType;

  // identification / site
  address: Sourced<string>;
  city: Sourced<string>;
  state: Sourced<string>;
  zip: Sourced<string>;
  county: Sourced<string>;
  apn: Sourced<string>;
  legalDescription: Sourced<string>;
  occupancy: Sourced<"Owner" | "Tenant" | "Vacant">;
  lotSizeSqFt: Sourced<number>;
  view: Sourced<string>;
  floodZone: Sourced<string>;
  zoning: Sourced<string>;

  // improvements
  yearBuilt: Sourced<number>;
  design: Sourced<string>;
  /** ANSI Z765-2021 above-grade finished area. */
  gla: Sourced<number>;
  belowGradeSqFt: Sourced<number>;
  belowGradeFinishedSqFt: Sourced<number>;
  roomCount: Sourced<number>;
  bedrooms: Sourced<number>;
  bathsFull: Sourced<number>;
  bathsHalf: Sourced<number>;
  quality: Sourced<QualityRating>;
  condition: Sourced<ConditionRating>;
  heating: Sourced<string>;
  cooling: Sourced<string>;
  garageSpaces: Sourced<number>;
  garageType: Sourced<string>;

  // condo / co-op project (dynamic section)
  projectName: Sourced<string>;
  hoaFeeMonthly: Sourced<number>;
  unitsInProject: Sourced<number>;

  // manufactured (dynamic section)
  hudCertLabel: Sourced<string>;
  makeModel: Sourced<string>;

  // 2-4 unit (dynamic section)
  unitCount: Sourced<number>;
  totalMonthlyRent: Sourced<number>;

  // ANSI sketch summary
  sketch: {
    standard: "ANSI Z765-2021";
    levels: SketchLevel[];
    notes: string;
  };
}

/** Subject field keys that hold Sourced<> values (everything except propertyType/sketch). */
export type SubjectFieldKey = Exclude<keyof SubjectProperty, "propertyType" | "sketch">;

// ---------------------------------------------------------------- comparables

export type CompStatus = "Settled" | "Pending" | "Active";

export interface CompAdjustment {
  attribute: string; // AdjustmentAttribute key
  amount: number; // signed dollars, + raises comp toward subject
  source: ProvenanceSource;
}

export interface Comparable {
  id: string;
  address: string;
  city: string;
  status: CompStatus;
  salePrice: number;
  saleDate: string; // ISO
  distanceMiles: number;
  locationRating: string;
  siteSqFt: number;
  view: string;
  design: string;
  quality: QualityRating;
  condition: ConditionRating;
  yearBuilt: number;
  roomCount: number;
  bedrooms: number;
  bathsFull: number;
  bathsHalf: number;
  gla: number;
  basementSqFt: number;
  basementFinishedSqFt: number;
  garageSpaces: number;
  saleType: string;
  concessions: number;
  /** Where the comp data came from. */
  provenance: Provenance;
  adjustments: CompAdjustment[];
}

/** A ranked candidate returned by the comp service, not yet in the grid. */
export interface CompCandidate {
  comp: Comparable;
  score: number; // 0..100
  rationale: string;
}

/** Per-attribute support/reasoning maintained in the Adjustments workspace. */
export interface AdjustmentBasis {
  attribute: string;
  /** e.g. "$42/sf — market extraction, 6 paired sales 2025H2" */
  basis: string;
  justification: string;
  source: ProvenanceSource;
}

// ---------------------------------------------------------------- AI

export type SuggestionTarget =
  | { kind: "subjectField"; fieldKey: SubjectFieldKey }
  | { kind: "adjustment"; compId: string; attribute: string }
  | { kind: "adjustmentBasis"; attribute: string }
  | { kind: "commentary"; blockId: string }
  | { kind: "photoLabel"; photoId: string };

export interface AISuggestion {
  id: string;
  target: SuggestionTarget;
  label: string;
  /** The typed value that will be applied on accept. */
  value: unknown;
  /** Human-readable rendering of value. */
  display: string;
  rationale: string;
  /** Field paths the model used — it must never write what the data doesn't support. */
  sourcesUsed: string[];
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

// ---------------------------------------------------------------- QC

export type QCSeverity = "Blocker" | "Warning" | "Note";

export interface QCIssue {
  id: string;
  severity: QCSeverity;
  /** Section to navigate to when clicked. */
  sectionId: string;
  /** Field anchor within the section, if any. */
  field?: string;
  message: string;
  detail?: string;
}

// ---------------------------------------------------------------- misc report

export type PhotoKind =
  | "subject-front"
  | "subject-rear"
  | "subject-street"
  | "interior"
  | "deficiency"
  | "comp"
  | "other";

export interface PhotoRecord {
  id: string;
  kind: PhotoKind;
  label: string;
  takenAt: string;
  /** Object/data URL for display; real storage is a seam. */
  url?: string;
  labelProvenance: Provenance | null;
}

export interface CommentaryBlock {
  id: string; // e.g. "neighborhood", "marketConditions", "improvements", "reconciliation"
  title: string;
  text: string;
  provenance: Provenance | null;
}

export interface Reconciliation {
  indicatedValueSalesComparison: Sourced<number>;
  finalValueOpinion: Sourced<number>;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  target?: string;
  before?: string;
  after?: string;
}

export interface Signoff {
  state: "none" | "pending" | "approved" | "changesRequested";
  requestedById?: string;
  reviewedById?: string;
  comment?: string;
  timestamp?: string;
}

// ---------------------------------------------------------------- report

export interface AppraisalReport {
  orderId: string;
  assignment: Assignment;
  subject: SubjectProperty;
  comps: Comparable[];
  adjustmentBases: AdjustmentBasis[];
  reconciliation: Reconciliation;
  commentary: CommentaryBlock[];
  photos: PhotoRecord[];
  suggestions: AISuggestion[];
  /** Append-only. */
  audit: AuditEntry[];
  signoff: Signoff;
}
