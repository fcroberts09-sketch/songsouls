/**
 * UAD 3.6 field registry. This single source of truth drives:
 *  - the subject intake forms (rendered generically from these defs)
 *  - required-field QC blockers
 *  - report completeness %
 *
 * `appliesTo` scopes a field to property types (dynamic URAR: sections and
 * fields turn on/off based on the subject, not a form number).
 */
import type {
  AppraisalReport,
  ConditionRating,
  PropertyType,
  QualityRating,
  SubjectFieldKey,
} from "@/lib/types";

export type FieldType =
  | "text"
  | "number"
  | "currency"
  | "select"
  | "condition"
  | "quality";

export interface SubjectFieldDef {
  key: SubjectFieldKey;
  label: string;
  type: FieldType;
  /** UAD section the field renders under. */
  sectionId: string;
  required: boolean;
  options?: string[];
  help?: string;
  /** Omit = all property types. */
  appliesTo?: PropertyType[];
  /** MISMO/UAD data point name, for the trust surface. */
  uadId?: string;
}

export const SUBJECT_FIELDS: SubjectFieldDef[] = [
  // --- subject identification & site
  { key: "address", label: "Street address", type: "text", sectionId: "subject", required: true, uadId: "AddressLineText" },
  { key: "city", label: "City", type: "text", sectionId: "subject", required: true, uadId: "CityName" },
  { key: "state", label: "State", type: "text", sectionId: "subject", required: true, uadId: "StateCode" },
  { key: "zip", label: "ZIP", type: "text", sectionId: "subject", required: true, uadId: "PostalCode" },
  { key: "county", label: "County", type: "text", sectionId: "subject", required: true, uadId: "CountyName" },
  { key: "apn", label: "Assessor parcel #", type: "text", sectionId: "subject", required: true, uadId: "AssessorParcelIdentifier" },
  { key: "legalDescription", label: "Legal description", type: "text", sectionId: "subject", required: true, uadId: "LegalDescriptionText" },
  { key: "occupancy", label: "Occupancy", type: "select", sectionId: "subject", required: true, options: ["Owner", "Tenant", "Vacant"], uadId: "PropertyCurrentOccupancyType" },
  { key: "lotSizeSqFt", label: "Site area (sq ft)", type: "number", sectionId: "subject", required: true, uadId: "SiteTotalSquareFeetNumber" },
  { key: "view", label: "View", type: "select", sectionId: "subject", required: true, options: ["Neutral", "Beneficial", "Adverse"], uadId: "PropertyViewType" },
  { key: "floodZone", label: "FEMA flood zone", type: "text", sectionId: "subject", required: true, uadId: "FloodZoneIdentifier" },
  { key: "zoning", label: "Zoning", type: "text", sectionId: "subject", required: true, uadId: "ZoningClassificationDescription" },

  // --- improvements
  { key: "yearBuilt", label: "Year built", type: "number", sectionId: "improvements", required: true, uadId: "PropertyStructureBuiltYear" },
  { key: "design", label: "Design (style)", type: "text", sectionId: "improvements", required: true, uadId: "DesignDescription" },
  { key: "gla", label: "GLA — above grade (sq ft, ANSI)", type: "number", sectionId: "improvements", required: true, help: "ANSI Z765-2021 finished above-grade area. Must match the sketch.", uadId: "GrossLivingAreaSquareFeetCount" },
  { key: "belowGradeSqFt", label: "Below-grade area (sq ft)", type: "number", sectionId: "improvements", required: false, uadId: "BelowGradeAreaSquareFeetCount" },
  { key: "belowGradeFinishedSqFt", label: "Below-grade finished (sq ft)", type: "number", sectionId: "improvements", required: false },
  { key: "roomCount", label: "Total rooms (above grade)", type: "number", sectionId: "improvements", required: true, uadId: "TotalRoomCount" },
  { key: "bedrooms", label: "Bedrooms", type: "number", sectionId: "improvements", required: true, uadId: "TotalBedroomCount" },
  { key: "bathsFull", label: "Full baths", type: "number", sectionId: "improvements", required: true, uadId: "TotalBathroomCount" },
  { key: "bathsHalf", label: "Half baths", type: "number", sectionId: "improvements", required: false },
  { key: "quality", label: "Quality of construction", type: "quality", sectionId: "improvements", required: true, uadId: "QualityOfConstructionType" },
  { key: "condition", label: "Condition", type: "condition", sectionId: "improvements", required: true, uadId: "PropertyConditionType" },
  { key: "heating", label: "Heating", type: "text", sectionId: "improvements", required: true },
  { key: "cooling", label: "Cooling", type: "text", sectionId: "improvements", required: true },
  { key: "garageSpaces", label: "Garage / carport spaces", type: "number", sectionId: "improvements", required: false },
  { key: "garageType", label: "Garage type", type: "select", sectionId: "improvements", required: false, options: ["Attached", "Detached", "Built-in", "Carport", "None"] },

  // --- condo / co-op project (dynamic)
  { key: "projectName", label: "Project name", type: "text", sectionId: "project", required: true, appliesTo: ["Condo", "Coop"], uadId: "ProjectName" },
  { key: "hoaFeeMonthly", label: "HOA fee (monthly)", type: "currency", sectionId: "project", required: true, appliesTo: ["Condo", "Coop"], uadId: "HOADuesAmount" },
  { key: "unitsInProject", label: "Units in project", type: "number", sectionId: "project", required: true, appliesTo: ["Condo", "Coop"], uadId: "ProjectUnitCount" },

  // --- manufactured (dynamic)
  { key: "hudCertLabel", label: "HUD certification label #", type: "text", sectionId: "manufactured", required: true, appliesTo: ["Manufactured"], uadId: "ManufacturedHomeHUDCertificationLabelIdentifier" },
  { key: "makeModel", label: "Make / model", type: "text", sectionId: "manufactured", required: true, appliesTo: ["Manufactured"] },

  // --- 2-4 unit income (dynamic)
  { key: "unitCount", label: "Number of units", type: "number", sectionId: "rentSchedule", required: true, appliesTo: ["TwoToFourUnit"] },
  { key: "totalMonthlyRent", label: "Total monthly market rent", type: "currency", sectionId: "rentSchedule", required: true, appliesTo: ["TwoToFourUnit"] },
];

export function fieldsForPropertyType(pt: PropertyType): SubjectFieldDef[] {
  return SUBJECT_FIELDS.filter((f) => !f.appliesTo || f.appliesTo.includes(pt));
}

// ---------------------------------------------------------------- ratings

export const CONDITION_DEFS: Record<ConditionRating, string> = {
  C1: "New construction — never occupied, no physical depreciation.",
  C2: "No deferred maintenance; recently fully renovated or like-new.",
  C3: "Well maintained, limited depreciation; some updated components.",
  C4: "Adequately maintained; minor deferred maintenance, normal wear.",
  C5: "Obvious deferred maintenance; livable but needs significant repairs.",
  C6: "Substantial damage or deficiencies affecting safety/soundness.",
};

export const QUALITY_DEFS: Record<QualityRating, string> = {
  Q1: "Unique custom design, highest-grade materials and craftsmanship.",
  Q2: "Custom or high-quality tract; upgraded materials throughout.",
  Q3: "Above-standard tract construction; some upgrades.",
  Q4: "Standard stock plans and materials; meets code.",
  Q5: "Economy construction; basic, functional materials.",
  Q6: "Basic/minimal quality; may not conform to code.",
};

export const CONDITION_RATINGS: ConditionRating[] = ["C1", "C2", "C3", "C4", "C5", "C6"];
export const QUALITY_RATINGS: QualityRating[] = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"];

// ---------------------------------------------------------------- dynamic sections

export interface SectionDef {
  id: string;
  title: string;
  /** Why this section is in the report (shown as the dynamic-URAR trust cue). */
  reason?: string;
}

/**
 * Derive the dynamic-URAR section list from subject + assignment.
 * One report type covers SFR, condo, 2-4 unit, manufactured, co-op —
 * sections turn on/off; there is no form switch.
 */
export function deriveSections(report: AppraisalReport): SectionDef[] {
  const pt = report.subject.propertyType;
  const sections: SectionDef[] = [
    { id: "assignment", title: "Assignment" },
    { id: "subject", title: "Subject & Site" },
    { id: "improvements", title: "Improvements" },
    { id: "sketch", title: "Sketch (ANSI)" },
  ];
  if (pt === "Condo" || pt === "Coop") {
    sections.push({
      id: "project",
      title: pt === "Coop" ? "Co-op Project" : "Condo Project",
      reason: `Included because the subject is a ${pt === "Coop" ? "co-op" : "condominium"} unit`,
    });
  }
  if (pt === "Manufactured") {
    sections.push({
      id: "manufactured",
      title: "Manufactured Home",
      reason: "Included because the subject is a manufactured home",
    });
  }
  if (pt === "TwoToFourUnit") {
    sections.push({
      id: "rentSchedule",
      title: "Income & Rent Schedule",
      reason: "Included because the subject is a 2–4 unit income property",
    });
  }
  sections.push(
    { id: "comps", title: "Sales Comparison" },
    { id: "adjustments", title: "Adjustments Support" },
    { id: "commentary", title: "Commentary" },
    { id: "reconciliation", title: "Reconciliation" },
    { id: "photos", title: "Photos" },
    { id: "workfile", title: "Workfile / Audit" },
    { id: "export", title: "Export (UCDP)" },
  );
  return sections;
}

export const PRODUCT_VARIANT_LABELS: Record<PropertyType, string> = {
  SFR: "URAR — Single Family",
  Condo: "URAR — Condominium",
  TwoToFourUnit: "URAR — 2–4 Unit",
  Manufactured: "URAR — Manufactured",
  Coop: "URAR — Co-operative",
};

// ---------------------------------------------------------------- guidelines

/** GSE-style comp guideline bounds used by the QC engine and grid flags. */
export const GUIDELINES = {
  minClosedComps: 3,
  maxCompDistanceMiles: 1.0,
  maxCompAgeMonths: 12,
  maxGlaDeltaPct: 0.2,
  maxNetAdjustmentPct: 0.15,
  maxGrossAdjustmentPct: 0.25,
  maxLineAdjustmentPct: 0.1,
  minPhotos: 6,
} as const;
