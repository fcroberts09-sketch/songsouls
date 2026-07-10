/**
 * Seed mock data: one tenant, three users (appraiser / trainee / supervisor),
 * and five orders spanning property types and pipeline stages so the dynamic
 * URAR, QC engine, and role gates are all demonstrable.
 */
import type {
  AppraisalReport,
  Assignment,
  AuditEntry,
  Comparable,
  CommentaryBlock,
  PropertyType,
  Provenance,
  SubjectProperty,
  Tenant,
  User,
} from "@/lib/types";
import { emptyField, sourced } from "@/lib/types";
import { PRODUCT_VARIANT_LABELS } from "@/lib/uad/fields";

// ---------------------------------------------------------------- time helpers

const NOW = Date.now();
function daysFromNow(n: number): string {
  return new Date(NOW + n * 86400000).toISOString();
}
function hoursAgo(n: number): string {
  return new Date(NOW - n * 3600000).toISOString();
}
function monthsAgo(n: number): string {
  const d = new Date(NOW);
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
}

// ---------------------------------------------------------------- provenance helpers

const pr = (h: number, detail = "County assessor roll 2025"): Provenance => ({
  source: "PublicRecord",
  timestamp: hoursAgo(h),
  confidence: 0.96,
  detail,
});
const mls = (h: number, detail: string): Provenance => ({
  source: "MLS",
  timestamp: hoursAgo(h),
  confidence: 0.97,
  detail,
});
const insp = (h: number): Provenance => ({
  source: "Inspection",
  timestamp: hoursAgo(h),
  detail: "Field inspection",
});
const me = (h: number): Provenance => ({ source: "Appraiser", timestamp: hoursAgo(h) });

// ---------------------------------------------------------------- tenancy

export const SEED_TENANT: Tenant = { id: "t1", name: "Desert Ridge Valuation Group" };

export const SEED_USERS: User[] = [
  { id: "u1", name: "Avery Marsh", role: "Appraiser", licenseNumber: "AZ-CR-31442", tenantId: "t1" },
  { id: "u2", name: "Jordan Pike", role: "Trainee", licenseNumber: "AZ-TR-09118", tenantId: "t1", supervisorId: "u3" },
  { id: "u3", name: "Sam Okafor", role: "Supervisor", licenseNumber: "AZ-CR-18250", tenantId: "t1" },
];

// ---------------------------------------------------------------- subject factory

function blankSubject(propertyType: PropertyType): SubjectProperty {
  return {
    propertyType,
    address: emptyField(),
    city: emptyField(),
    state: emptyField(),
    zip: emptyField(),
    county: emptyField(),
    apn: emptyField(),
    legalDescription: emptyField(),
    occupancy: emptyField(),
    lotSizeSqFt: emptyField(),
    view: emptyField(),
    floodZone: emptyField(),
    zoning: emptyField(),
    yearBuilt: emptyField(),
    design: emptyField(),
    gla: emptyField(),
    belowGradeSqFt: emptyField(),
    belowGradeFinishedSqFt: emptyField(),
    roomCount: emptyField(),
    bedrooms: emptyField(),
    bathsFull: emptyField(),
    bathsHalf: emptyField(),
    quality: emptyField(),
    condition: emptyField(),
    heating: emptyField(),
    cooling: emptyField(),
    garageSpaces: emptyField(),
    garageType: emptyField(),
    projectName: emptyField(),
    hoaFeeMonthly: emptyField(),
    unitsInProject: emptyField(),
    hudCertLabel: emptyField(),
    makeModel: emptyField(),
    unitCount: emptyField(),
    totalMonthlyRent: emptyField(),
    sketch: { standard: "ANSI Z765-2021", levels: [], notes: "" },
  };
}

function defaultCommentary(): CommentaryBlock[] {
  return [
    { id: "neighborhood", title: "Neighborhood", text: "", provenance: null },
    { id: "marketConditions", title: "Market Conditions", text: "", provenance: null },
    { id: "improvements", title: "Improvements", text: "", provenance: null },
    { id: "reconciliation", title: "Reconciliation", text: "", provenance: null },
  ];
}

let auditN = 0;
function audit(actorId: string, actorName: string, action: string, target?: string, hoursBack = 24): AuditEntry {
  auditN += 1;
  return { id: `seed_a${auditN}`, timestamp: hoursAgo(hoursBack), actorId, actorName, action, target };
}

function assignment(a: Omit<Assignment, "productVariant">, pt: PropertyType): Assignment {
  return { ...a, productVariant: PRODUCT_VARIANT_LABELS[pt] };
}

// ---------------------------------------------------------------- order 1001 — SFR purchase, mid-report

function order1001(): AppraisalReport {
  const s = blankSubject("SFR");
  s.address = sourced("8214 E Mariposa Grande Ln", me(80));
  s.city = sourced("Scottsdale", me(80));
  s.state = sourced("AZ", me(80));
  s.zip = sourced("85255", me(80));
  s.county = sourced("Maricopa", pr(3));
  s.apn = sourced("217-44-107", pr(3));
  s.legalDescription = sourced("LOT 14 BLK 3 DESERT VISTA UNIT 2", pr(3, "Recorded plat"));
  s.occupancy = sourced("Owner", insp(50));
  s.lotSizeSqFt = sourced(7405, pr(3, "County GIS"));
  s.view = sourced("Neutral", insp(50));
  s.floodZone = sourced("X (unshaded)", pr(3, "FEMA NFHL effective panel"));
  s.zoning = sourced("R1-6", pr(3, "Municipal zoning layer"));
  s.yearBuilt = sourced(1999, pr(3));
  s.design = sourced("Ranch", insp(50));
  s.gla = sourced(1850, insp(50));
  s.belowGradeSqFt = sourced(0, insp(50));
  s.belowGradeFinishedSqFt = sourced(0, insp(50));
  s.roomCount = sourced(7, insp(50));
  s.bedrooms = sourced(4, insp(50));
  s.bathsFull = sourced(2, insp(50));
  s.bathsHalf = sourced(0, insp(50));
  s.quality = sourced("Q4", insp(50));
  s.condition = sourced("C3", insp(50));
  s.heating = sourced("FWA / gas", insp(50));
  s.cooling = sourced("Central", insp(50));
  s.garageSpaces = sourced(2, insp(50));
  s.garageType = sourced("Attached", insp(50));
  s.sketch = {
    standard: "ANSI Z765-2021",
    levels: [{ name: "First floor", areaSqFt: 1850, belowGrade: false }],
    notes: "Measured to ANSI Z765-2021; exterior dimensions, 0.1 ft precision.",
  };

  const comps: Comparable[] = [
    {
      id: "c1001-1",
      address: "8190 E Mariposa Grande Ln",
      city: "Scottsdale",
      status: "Settled",
      salePrice: 462000,
      saleDate: monthsAgo(2),
      distanceMiles: 0.12,
      locationRating: "Neutral",
      siteSqFt: 7250,
      view: "Neutral",
      design: "Ranch",
      quality: "Q4",
      condition: "C3",
      yearBuilt: 1998,
      roomCount: 7,
      bedrooms: 4,
      bathsFull: 2,
      bathsHalf: 0,
      gla: 1760,
      basementSqFt: 0,
      basementFinishedSqFt: 0,
      garageSpaces: 2,
      saleType: "Arm's length",
      concessions: 0,
      provenance: mls(26, "ARMLS #6841220"),
      adjustments: [{ attribute: "gla", amount: 4000, source: "Appraiser" }],
    },
    {
      id: "c1001-2",
      address: "8455 E Sweetwater Ave",
      city: "Scottsdale",
      status: "Settled",
      salePrice: 449500,
      saleDate: monthsAgo(4),
      distanceMiles: 0.41,
      locationRating: "Neutral",
      siteSqFt: 7800,
      view: "Neutral",
      design: "Ranch",
      quality: "Q4",
      condition: "C4",
      yearBuilt: 1997,
      roomCount: 6,
      bedrooms: 3,
      bathsFull: 2,
      bathsHalf: 0,
      gla: 1705,
      basementSqFt: 0,
      basementFinishedSqFt: 0,
      garageSpaces: 2,
      saleType: "Arm's length",
      concessions: 5000,
      provenance: mls(26, "ARMLS #6838914"),
      adjustments: [],
    },
    {
      id: "c1001-3",
      address: "7902 E Cholla St",
      city: "Scottsdale",
      status: "Settled",
      salePrice: 478000,
      saleDate: monthsAgo(3),
      distanceMiles: 1.18,
      locationRating: "Neutral",
      siteSqFt: 8050,
      view: "Neutral",
      design: "Ranch",
      quality: "Q4",
      condition: "C3",
      yearBuilt: 2001,
      roomCount: 8,
      bedrooms: 4,
      bathsFull: 2,
      bathsHalf: 1,
      gla: 1960,
      basementSqFt: 0,
      basementFinishedSqFt: 0,
      garageSpaces: 3,
      saleType: "Arm's length",
      concessions: 0,
      provenance: mls(26, "ARMLS #6845001"),
      adjustments: [{ attribute: "garage", amount: -7500, source: "Appraiser" }],
    },
  ];

  return {
    orderId: "1001",
    assignment: assignment(
      {
        id: "1001",
        client: "Summit Lending",
        clientType: "Lender",
        intendedUse: "Mortgage finance transaction",
        intendedUser: "Summit Lending, its successors and assigns",
        assignmentType: "Purchase",
        contractPrice: 465000,
        effectiveDate: hoursAgo(50),
        orderedDate: daysFromNow(-6),
        dueDate: daysFromNow(2),
        assignedTo: "u1",
        status: "In Report",
        fee: 550,
      },
      "SFR",
    ),
    subject: s,
    comps,
    adjustmentBases: [
      {
        attribute: "gla",
        basis: "$45/sf — market extraction, 6 paired sales 2025H2",
        justification: "GLA differences over 50 sf adjusted at $45/sf, supported by paired-sales analysis of six 2025 H2 transactions in the subject subdivision.",
        source: "Appraiser",
      },
    ],
    reconciliation: {
      indicatedValueSalesComparison: emptyField(),
      finalValueOpinion: emptyField(),
    },
    commentary: defaultCommentary(),
    photos: [
      { id: "p1", kind: "subject-front", label: "Front exterior", takenAt: hoursAgo(50), labelProvenance: me(50) },
      { id: "p2", kind: "subject-street", label: "Street scene", takenAt: hoursAgo(50), labelProvenance: me(50) },
      { id: "p3", kind: "interior", label: "Kitchen", takenAt: hoursAgo(50), labelProvenance: me(50) },
      { id: "p4", kind: "interior", label: "Living room", takenAt: hoursAgo(50), labelProvenance: me(50) },
      { id: "p5", kind: "interior", label: "Primary bath", takenAt: hoursAgo(50), labelProvenance: me(50) },
    ],
    suggestions: [],
    audit: [
      audit("u1", "Avery Marsh", "Order opened", undefined, 80),
      audit("u1", "Avery Marsh", "Autofill from public record (7 fields)", "subject", 3),
      audit("u1", "Avery Marsh", "Inspection data entered", "subject", 50),
      audit("u1", "Avery Marsh", "3 comparables added from MLS", "comps", 26),
    ],
    signoff: { state: "none" },
  };
}

// ---------------------------------------------------------------- order 1002 — condo refi, trainee, new

function order1002(): AppraisalReport {
  const s = blankSubject("Condo");
  s.address = sourced("2989 N 44th St Unit 2041", me(20));
  s.city = sourced("Phoenix", me(20));
  s.state = sourced("AZ", me(20));
  s.zip = sourced("85018", me(20));
  s.county = sourced("Maricopa", pr(20));
  s.apn = sourced("171-22-403", pr(20));
  s.zoning = sourced("R-4", pr(20, "Municipal zoning layer"));

  return {
    orderId: "1002",
    assignment: assignment(
      {
        id: "1002",
        client: "Clearpath AMC",
        clientType: "AMC",
        intendedUse: "Mortgage refinance transaction",
        intendedUser: "Clearpath AMC on behalf of lender",
        assignmentType: "Refinance",
        contractPrice: null,
        effectiveDate: null,
        orderedDate: daysFromNow(-1),
        dueDate: daysFromNow(6),
        assignedTo: "u2",
        status: "New",
        fee: 475,
      },
      "Condo",
    ),
    subject: s,
    comps: [],
    adjustmentBases: [],
    reconciliation: { indicatedValueSalesComparison: emptyField(), finalValueOpinion: emptyField() },
    commentary: defaultCommentary(),
    photos: [],
    suggestions: [],
    audit: [audit("u2", "Jordan Pike", "Order opened", undefined, 20)],
    signoff: { state: "none" },
  };
}

// ---------------------------------------------------------------- order 1003 — SFR refi, complete & green

function order1003(): AppraisalReport {
  const s = blankSubject("SFR");
  s.address = sourced("1530 W Tuckey Ln", me(120));
  s.city = sourced("Phoenix", me(120));
  s.state = sourced("AZ", me(120));
  s.zip = sourced("85015", me(120));
  s.county = sourced("Maricopa", pr(120));
  s.apn = sourced("155-18-022", pr(120));
  s.legalDescription = sourced("LOT 22 TUCKEY TERRACE", pr(120, "Recorded plat"));
  s.occupancy = sourced("Owner", insp(96));
  s.lotSizeSqFt = sourced(8100, pr(120, "County GIS"));
  s.view = sourced("Neutral", insp(96));
  s.floodZone = sourced("X (unshaded)", pr(120, "FEMA NFHL effective panel"));
  s.zoning = sourced("R1-6", pr(120));
  s.yearBuilt = sourced(1962, pr(120));
  s.design = sourced("Ranch", insp(96));
  s.gla = sourced(1610, insp(96));
  s.belowGradeSqFt = sourced(0, insp(96));
  s.belowGradeFinishedSqFt = sourced(0, insp(96));
  s.roomCount = sourced(6, insp(96));
  s.bedrooms = sourced(3, insp(96));
  s.bathsFull = sourced(2, insp(96));
  s.bathsHalf = sourced(0, insp(96));
  s.quality = sourced("Q4", insp(96));
  s.condition = sourced("C3", insp(96));
  s.heating = sourced("FWA / electric", insp(96));
  s.cooling = sourced("Central", insp(96));
  s.garageSpaces = sourced(2, insp(96));
  s.garageType = sourced("Detached", insp(96));
  s.sketch = {
    standard: "ANSI Z765-2021",
    levels: [{ name: "First floor", areaSqFt: 1610, belowGrade: false }],
    notes: "Single level; measured exterior per ANSI Z765-2021.",
  };

  const mkComp = (over: Partial<Comparable>): Comparable => ({
    id: "x",
    address: "",
    city: "Phoenix",
    status: "Settled",
    salePrice: 0,
    saleDate: monthsAgo(3),
    distanceMiles: 0.3,
    locationRating: "Neutral",
    siteSqFt: 8000,
    view: "Neutral",
    design: "Ranch",
    quality: "Q4",
    condition: "C3",
    yearBuilt: 1961,
    roomCount: 6,
    bedrooms: 3,
    bathsFull: 2,
    bathsHalf: 0,
    gla: 1600,
    basementSqFt: 0,
    basementFinishedSqFt: 0,
    garageSpaces: 2,
    saleType: "Arm's length",
    concessions: 0,
    provenance: mls(96, "ARMLS"),
    adjustments: [],
    ...over,
  });

  const comps: Comparable[] = [
    mkComp({
      id: "c1003-1",
      address: "1612 W Tuckey Ln",
      salePrice: 415000,
      saleDate: monthsAgo(2),
      distanceMiles: 0.08,
      gla: 1580,
      adjustments: [{ attribute: "gla", amount: 1500, source: "Appraiser" }],
    }),
    mkComp({
      id: "c1003-2",
      address: "4830 N 17th Ave",
      salePrice: 408000,
      saleDate: monthsAgo(4),
      distanceMiles: 0.52,
      gla: 1540,
      garageSpaces: 1,
      adjustments: [
        { attribute: "gla", amount: 3000, source: "Appraiser" },
        { attribute: "garage", amount: 7500, source: "Appraiser" },
      ],
    }),
    mkComp({
      id: "c1003-3",
      address: "1745 W Glenrosa Ave",
      salePrice: 429000,
      saleDate: monthsAgo(5),
      distanceMiles: 0.77,
      gla: 1700,
      adjustments: [{ attribute: "gla", amount: -4000, source: "Appraiser" }],
    }),
  ];

  const commentary = defaultCommentary().map((b) => ({
    ...b,
    provenance: { source: "AI" as const, timestamp: hoursAgo(30), detail: "Accepted by Avery Marsh" },
    text:
      b.id === "neighborhood"
        ? "The subject is located in the Tuckey Terrace area of central Phoenix, Maricopa County. The neighborhood is fully built-out single-family residential, predominantly 1950s–1960s ranch construction. Zoning is R1-6; the subject's use is legal and conforming. No adverse influences were noted."
        : b.id === "marketConditions"
          ? "Analysis of settled sales indicates closed prices from $408,000 to $429,000 over the past five months. Supply and demand are in balance; marketing times are typical at 30–45 days. No time adjustment was indicated by the paired data."
          : b.id === "improvements"
            ? "The subject is a 1962-built ranch single-family residence containing 1,610 sq ft of above-grade living area (ANSI Z765-2021), with 3 bedrooms and 2.0 baths. Condition is rated C3 and quality Q4 per UAD definitions. No physical deficiencies affecting livability were observed."
            : "Adjusted sale prices range from $416,500 to $425,000. Greatest weight was placed on Comp 1, a model match on the subject street requiring the least adjustment. The sales comparison approach was given sole weight. The opinion of market value is reconciled at $420,000.",
  }));

  return {
    orderId: "1003",
    assignment: assignment(
      {
        id: "1003",
        client: "Pinnacle Bank",
        clientType: "Lender",
        intendedUse: "Mortgage refinance transaction",
        intendedUser: "Pinnacle Bank",
        assignmentType: "Refinance",
        contractPrice: null,
        effectiveDate: hoursAgo(96),
        orderedDate: daysFromNow(-9),
        dueDate: daysFromNow(1),
        assignedTo: "u1",
        status: "Ready",
        fee: 525,
      },
      "SFR",
    ),
    subject: s,
    comps,
    adjustmentBases: [
      {
        attribute: "gla",
        basis: "$40/sf — market extraction, 5 paired sales",
        justification: "GLA adjusted at $40/sf per paired-sales extraction from five neighborhood transactions.",
        source: "Appraiser",
      },
      {
        attribute: "garage",
        basis: "$7,500/space — paired sales",
        justification: "Garage spaces adjusted at $7,500 per space, supported by two garage/no-garage pairs.",
        source: "Appraiser",
      },
    ],
    reconciliation: {
      indicatedValueSalesComparison: sourced(420000, me(28)),
      finalValueOpinion: sourced(420000, me(28)),
    },
    commentary,
    photos: [
      { id: "q1", kind: "subject-front", label: "Front exterior", takenAt: hoursAgo(96), labelProvenance: me(96) },
      { id: "q2", kind: "subject-rear", label: "Rear exterior", takenAt: hoursAgo(96), labelProvenance: me(96) },
      { id: "q3", kind: "subject-street", label: "Street scene", takenAt: hoursAgo(96), labelProvenance: me(96) },
      { id: "q4", kind: "interior", label: "Kitchen", takenAt: hoursAgo(96), labelProvenance: { source: "AI", timestamp: hoursAgo(95), confidence: 0.93 } },
      { id: "q5", kind: "interior", label: "Living room", takenAt: hoursAgo(96), labelProvenance: { source: "AI", timestamp: hoursAgo(95), confidence: 0.91 } },
      { id: "q6", kind: "interior", label: "Primary bedroom", takenAt: hoursAgo(96), labelProvenance: me(96) },
      { id: "q7", kind: "interior", label: "Hall bath", takenAt: hoursAgo(96), labelProvenance: me(96) },
    ],
    suggestions: [],
    audit: [
      audit("u1", "Avery Marsh", "Order opened", undefined, 130),
      audit("u1", "Avery Marsh", "Inspection completed", "subject", 96),
      audit("u1", "Avery Marsh", "Commentary drafts accepted (4 blocks)", "commentary", 30),
      audit("u1", "Avery Marsh", "Final value reconciled at $420,000", "reconciliation", 28),
    ],
    signoff: { state: "none" },
  };
}

// ---------------------------------------------------------------- order 1004 — 2-4 unit, inspected

function order1004(): AppraisalReport {
  const s = blankSubject("TwoToFourUnit");
  s.address = sourced("914 E Whitton Ave", me(70));
  s.city = sourced("Phoenix", me(70));
  s.state = sourced("AZ", me(70));
  s.zip = sourced("85014", me(70));
  s.county = sourced("Maricopa", pr(8));
  s.apn = sourced("118-30-051", pr(8));
  s.legalDescription = sourced("LOT 5 WHITTON PLACE", pr(8, "Recorded plat"));
  s.occupancy = sourced("Tenant", insp(40));
  s.lotSizeSqFt = sourced(9600, pr(8, "County GIS"));
  s.view = sourced("Neutral", insp(40));
  s.floodZone = sourced("X (unshaded)", pr(8, "FEMA NFHL effective panel"));
  s.zoning = sourced("R-3", pr(8));
  s.yearBuilt = sourced(1974, pr(8));
  s.design = sourced("Duplex / single story", insp(40));
  s.gla = sourced(2300, insp(40));
  s.roomCount = sourced(8, insp(40));
  s.bedrooms = sourced(4, insp(40));
  s.bathsFull = sourced(2, insp(40));
  s.quality = sourced("Q4", insp(40));
  s.condition = sourced("C4", insp(40));
  s.heating = sourced("FWA / electric", insp(40));
  s.cooling = sourced("Central", insp(40));
  s.unitCount = sourced(2, insp(40));
  // totalMonthlyRent intentionally missing → dynamic-section blocker
  s.sketch = {
    standard: "ANSI Z765-2021",
    levels: [{ name: "Units 1+2 (first floor)", areaSqFt: 2400, belowGrade: false }],
    notes: "Sketch total pending re-measure of unit 2 storage area.",
  };

  return {
    orderId: "1004",
    assignment: assignment(
      {
        id: "1004",
        client: "Clearpath AMC",
        clientType: "AMC",
        intendedUse: "Mortgage finance transaction",
        intendedUser: "Clearpath AMC on behalf of lender",
        assignmentType: "Purchase",
        contractPrice: 610000,
        effectiveDate: hoursAgo(40),
        orderedDate: daysFromNow(-4),
        dueDate: daysFromNow(0),
        assignedTo: "u1",
        status: "Inspected",
        fee: 750,
      },
      "TwoToFourUnit",
    ),
    subject: s,
    comps: [],
    adjustmentBases: [],
    reconciliation: { indicatedValueSalesComparison: emptyField(), finalValueOpinion: emptyField() },
    commentary: defaultCommentary(),
    photos: [
      { id: "r1", kind: "subject-front", label: "Front exterior", takenAt: hoursAgo(40), labelProvenance: me(40) },
    ],
    suggestions: [],
    audit: [
      audit("u1", "Avery Marsh", "Order opened", undefined, 96),
      audit("u1", "Avery Marsh", "Inspection completed", "subject", 40),
    ],
    signoff: { state: "none" },
  };
}

// ---------------------------------------------------------------- order 1005 — manufactured, overdue

function order1005(): AppraisalReport {
  const s = blankSubject("Manufactured");
  s.address = sourced("22610 W Hilton Ave Sp 41", me(150));
  s.city = sourced("Buckeye", me(150));
  s.state = sourced("AZ", me(150));
  s.zip = sourced("85326", me(150));
  s.county = sourced("Maricopa", pr(150));

  return {
    orderId: "1005",
    assignment: assignment(
      {
        id: "1005",
        client: "Summit Lending",
        clientType: "Lender",
        intendedUse: "Mortgage finance transaction",
        intendedUser: "Summit Lending",
        assignmentType: "Purchase",
        contractPrice: 285000,
        effectiveDate: null,
        orderedDate: daysFromNow(-12),
        dueDate: daysFromNow(-2),
        assignedTo: "u2",
        status: "New",
        fee: 600,
      },
      "Manufactured",
    ),
    subject: s,
    comps: [],
    adjustmentBases: [],
    reconciliation: { indicatedValueSalesComparison: emptyField(), finalValueOpinion: emptyField() },
    commentary: defaultCommentary(),
    photos: [],
    suggestions: [],
    audit: [audit("u2", "Jordan Pike", "Order opened", undefined, 150)],
    signoff: { state: "none" },
  };
}

// ---------------------------------------------------------------- exports

export function seedReports(): Record<string, AppraisalReport> {
  return {
    "1001": order1001(),
    "1002": order1002(),
    "1003": order1003(),
    "1004": order1004(),
    "1005": order1005(),
  };
}
