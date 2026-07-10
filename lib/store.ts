"use client";
/**
 * App store. Holds users/tenancy and the report map. QC + completeness are
 * NOT stored — they are derived selectors (lib/qc) recomputed from the report
 * on every change. Every mutation appends to the report's audit trail;
 * nothing is silently overwritten.
 */
import { create } from "zustand";
import type {
  AISuggestion,
  AppraisalReport,
  AuditEntry,
  Comparable,
  OrderStatus,
  PhotoRecord,
  Provenance,
  ProvenanceSource,
  SubjectFieldKey,
  Tenant,
  User,
} from "@/lib/types";
import { seedReports, SEED_TENANT, SEED_USERS } from "@/lib/seed";
import { uid } from "@/lib/format";
import { attributeLabel } from "@/lib/comp";

interface AppState {
  tenant: Tenant;
  users: User[];
  currentUserId: string;
  reports: Record<string, AppraisalReport>;

  setCurrentUser(id: string): void;

  setSubjectField(orderId: string, key: SubjectFieldKey, value: unknown, source?: ProvenanceSource): void;
  setSketchNotes(orderId: string, notes: string): void;
  setSketchLevel(orderId: string, index: number, areaSqFt: number): void;
  setAssignmentEffectiveDate(orderId: string, iso: string): void;
  setContractPrice(orderId: string, amount: number | null): void;
  setStatus(orderId: string, status: OrderStatus): void;

  addComp(orderId: string, comp: Comparable): void;
  removeComp(orderId: string, compId: string): void;
  setAdjustment(orderId: string, compId: string, attribute: string, amount: number, source?: ProvenanceSource): void;
  setAdjustmentBasis(orderId: string, attribute: string, basis: string, justification: string): void;

  setCommentary(orderId: string, blockId: string, text: string, provenance: Provenance): void;
  setReconciliation(orderId: string, key: "indicatedValueSalesComparison" | "finalValueOpinion", value: number | null): void;

  addSuggestions(orderId: string, suggestions: AISuggestion[]): void;
  acceptSuggestion(orderId: string, suggestionId: string): void;
  rejectSuggestion(orderId: string, suggestionId: string): void;

  addPhoto(orderId: string, photo: PhotoRecord): void;
  updatePhoto(orderId: string, photoId: string, patch: Partial<PhotoRecord>): void;

  requestSignoff(orderId: string): void;
  reviewSignoff(orderId: string, approve: boolean, comment: string): void;
}

function nowIso(): string {
  return new Date().toISOString();
}

export const useAppStore = create<AppState>((set, get) => {
  /** Immutable per-report update + append-only audit entry. */
  function mutate(
    orderId: string,
    action: string,
    fn: (r: AppraisalReport) => AppraisalReport,
    detail?: { target?: string; before?: string; after?: string },
  ) {
    set((state) => {
      const report = state.reports[orderId];
      if (!report) return state;
      const actor = state.users.find((u) => u.id === state.currentUserId);
      const entry: AuditEntry = {
        id: uid("a"),
        timestamp: nowIso(),
        actorId: actor?.id ?? "?",
        actorName: actor?.name ?? "Unknown",
        action,
        ...detail,
      };
      const next = fn(report);
      return {
        reports: {
          ...state.reports,
          [orderId]: { ...next, audit: [...next.audit, entry] },
        },
      };
    });
  }

  function applySuggestion(r: AppraisalReport, s: AISuggestion): AppraisalReport {
    const prov: Provenance = {
      source: "AI",
      timestamp: nowIso(),
      detail: "AI suggestion — accepted by appraiser",
    };
    switch (s.target.kind) {
      case "subjectField": {
        const key = s.target.fieldKey;
        return {
          ...r,
          subject: { ...r.subject, [key]: { value: s.value, provenance: prov } },
        };
      }
      case "adjustment": {
        const { compId, attribute } = s.target;
        return {
          ...r,
          comps: r.comps.map((c) =>
            c.id === compId
              ? {
                  ...c,
                  adjustments: [
                    ...c.adjustments.filter((a) => a.attribute !== attribute),
                    { attribute, amount: s.value as number, source: "AI" as const },
                  ],
                }
              : c,
          ),
        };
      }
      case "adjustmentBasis": {
        const { attribute } = s.target;
        const rest = r.adjustmentBases.filter((b) => b.attribute !== attribute);
        return {
          ...r,
          adjustmentBases: [
            ...rest,
            { attribute, basis: s.display, justification: s.rationale, source: "AI" },
          ],
        };
      }
      case "commentary": {
        const blockId = s.target.blockId;
        return {
          ...r,
          commentary: r.commentary.map((b) =>
            b.id === blockId ? { ...b, text: s.value as string, provenance: prov } : b,
          ),
        };
      }
      case "photoLabel": {
        const photoId = s.target.photoId;
        const v = s.value as { label: string; kind: PhotoRecord["kind"] };
        return {
          ...r,
          photos: r.photos.map((p) =>
            p.id === photoId ? { ...p, label: v.label, kind: v.kind, labelProvenance: prov } : p,
          ),
        };
      }
    }
  }

  return {
    tenant: SEED_TENANT,
    users: SEED_USERS,
    currentUserId: "u1",
    reports: seedReports(),

    setCurrentUser: (id) => set({ currentUserId: id }),

    setSubjectField: (orderId, key, value, source = "Appraiser") =>
      mutate(
        orderId,
        `Set ${String(key)}`,
        (r) => ({
          ...r,
          subject: {
            ...r.subject,
            [key]: {
              value: value === "" ? null : value,
              provenance: { source, timestamp: nowIso() },
            },
          },
        }),
        {
          target: `subject.${String(key)}`,
          before: String(get().reports[orderId]?.subject[key]?.value ?? "—"),
          after: String(value),
        },
      ),

    setSketchNotes: (orderId, notes) =>
      mutate(orderId, "Edited sketch notes", (r) => ({
        ...r,
        subject: { ...r.subject, sketch: { ...r.subject.sketch, notes } },
      })),

    setSketchLevel: (orderId, index, areaSqFt) =>
      mutate(
        orderId,
        "Edited sketch level area",
        (r) => ({
          ...r,
          subject: {
            ...r.subject,
            sketch: {
              ...r.subject.sketch,
              levels: r.subject.sketch.levels.map((l, i) => (i === index ? { ...l, areaSqFt } : l)),
            },
          },
        }),
        { target: "sketch" },
      ),

    setAssignmentEffectiveDate: (orderId, iso) =>
      mutate(orderId, "Set effective date", (r) => ({
        ...r,
        assignment: { ...r.assignment, effectiveDate: iso },
      })),

    setContractPrice: (orderId, amount) =>
      mutate(orderId, "Set contract price", (r) => ({
        ...r,
        assignment: { ...r.assignment, contractPrice: amount },
      })),

    setStatus: (orderId, status) =>
      mutate(orderId, `Status → ${status}`, (r) => ({
        ...r,
        assignment: { ...r.assignment, status },
      })),

    addComp: (orderId, comp) =>
      mutate(orderId, `Added comparable: ${comp.address}`, (r) => ({
        ...r,
        comps: [...r.comps, comp],
      }), { target: "comps" }),

    removeComp: (orderId, compId) =>
      mutate(
        orderId,
        `Removed comparable: ${get().reports[orderId]?.comps.find((c) => c.id === compId)?.address ?? compId}`,
        (r) => ({ ...r, comps: r.comps.filter((c) => c.id !== compId) }),
        { target: "comps" },
      ),

    setAdjustment: (orderId, compId, attribute, amount, source = "Appraiser") =>
      mutate(
        orderId,
        `Adjustment: ${attributeLabel(attribute)}`,
        (r) => ({
          ...r,
          comps: r.comps.map((c) =>
            c.id === compId
              ? {
                  ...c,
                  adjustments:
                    amount === 0
                      ? c.adjustments.filter((a) => a.attribute !== attribute)
                      : [
                          ...c.adjustments.filter((a) => a.attribute !== attribute),
                          { attribute, amount, source },
                        ],
                }
              : c,
          ),
        }),
        { target: `${compId}.${attribute}`, after: String(amount) },
      ),

    setAdjustmentBasis: (orderId, attribute, basis, justification) =>
      mutate(orderId, `Adjustment support: ${attributeLabel(attribute)}`, (r) => ({
        ...r,
        adjustmentBases: [
          ...r.adjustmentBases.filter((b) => b.attribute !== attribute),
          { attribute, basis, justification, source: "Appraiser" },
        ],
      })),

    setCommentary: (orderId, blockId, text, provenance) =>
      mutate(orderId, `Commentary edited: ${blockId}`, (r) => ({
        ...r,
        commentary: r.commentary.map((b) => (b.id === blockId ? { ...b, text, provenance } : b)),
      }), { target: `commentary.${blockId}` }),

    setReconciliation: (orderId, key, value) =>
      mutate(
        orderId,
        key === "finalValueOpinion" ? "Final value opinion set" : "Indicated value set",
        (r) => ({
          ...r,
          reconciliation: {
            ...r.reconciliation,
            [key]: { value, provenance: { source: "Appraiser" as const, timestamp: nowIso() } },
          },
        }),
        { target: `reconciliation.${key}`, after: String(value) },
      ),

    addSuggestions: (orderId, suggestions) =>
      mutate(orderId, `AI returned ${suggestions.length} suggestion(s)`, (r) => ({
        ...r,
        suggestions: [...r.suggestions, ...suggestions],
      })),

    acceptSuggestion: (orderId, suggestionId) =>
      mutate(
        orderId,
        "Accepted AI suggestion",
        (r) => {
          const s = r.suggestions.find((x) => x.id === suggestionId);
          if (!s || s.status !== "pending") return r;
          const applied = applySuggestion(r, s);
          return {
            ...applied,
            suggestions: applied.suggestions.map((x) =>
              x.id === suggestionId ? { ...x, status: "accepted" as const } : x,
            ),
          };
        },
        { target: get().reports[orderId]?.suggestions.find((s) => s.id === suggestionId)?.label },
      ),

    rejectSuggestion: (orderId, suggestionId) =>
      mutate(
        orderId,
        "Rejected AI suggestion",
        (r) => ({
          ...r,
          suggestions: r.suggestions.map((x) =>
            x.id === suggestionId ? { ...x, status: "rejected" as const } : x,
          ),
        }),
        { target: get().reports[orderId]?.suggestions.find((s) => s.id === suggestionId)?.label },
      ),

    addPhoto: (orderId, photo) =>
      mutate(orderId, `Photo added: ${photo.label || photo.kind}`, (r) => ({
        ...r,
        photos: [...r.photos, photo],
      }), { target: "photos" }),

    updatePhoto: (orderId, photoId, patch) =>
      mutate(orderId, "Photo updated", (r) => ({
        ...r,
        photos: r.photos.map((p) => (p.id === photoId ? { ...p, ...patch } : p)),
      }), { target: `photos.${photoId}` }),

    requestSignoff: (orderId) =>
      mutate(orderId, "Sign-off requested from supervisor", (r) => ({
        ...r,
        signoff: { state: "pending", requestedById: get().currentUserId, timestamp: nowIso() },
        assignment: { ...r.assignment, status: "QC" },
      })),

    reviewSignoff: (orderId, approve, comment) =>
      mutate(orderId, approve ? "Supervisor approved report" : "Supervisor requested changes", (r) => ({
        ...r,
        signoff: {
          ...r.signoff,
          state: approve ? "approved" : "changesRequested",
          reviewedById: get().currentUserId,
          comment,
          timestamp: nowIso(),
        },
      })),
  };
});

// ---------------------------------------------------------------- auth/tenancy stubs

/** // SEAM: real auth — replace with the identity provider's session. */
export function useCurrentUser(): User {
  const users = useAppStore((s) => s.users);
  const id = useAppStore((s) => s.currentUserId);
  return users.find((u) => u.id === id) ?? users[0];
}

export function useTenant(): Tenant {
  return useAppStore((s) => s.tenant);
}

export function useReport(orderId: string): AppraisalReport | undefined {
  return useAppStore((s) => s.reports[orderId]);
}
