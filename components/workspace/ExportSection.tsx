"use client";
/**
 * Export-readiness preflight for the UCDP package (MISMO 3.6 XML + PDF +
 * image folder, zipped). The build CTA stays disabled while blockers exist,
 * and trainee work is gated behind supervisor sign-off (USPAP supervision).
 */
import { useState } from "react";
import type { AppraisalReport, QCIssue } from "@/lib/types";
import { useAppStore, useCurrentUser } from "@/lib/store";
import { exportService, type PackageManifest } from "@/lib/services/exportService";
import { qcCounts } from "@/lib/qc/rules";
import { GUIDELINES } from "@/lib/uad/fields";
import { fmtNumber } from "@/lib/format";
import { Button, Spinner } from "@/components/ui";

export function ExportSection({
  report,
  issues,
  onNavigate,
}: {
  report: AppraisalReport;
  issues: QCIssue[];
  onNavigate: (sectionId: string, field?: string) => void;
}) {
  const user = useCurrentUser();
  const setStatus = useAppStore((s) => s.setStatus);
  const requestSignoff = useAppStore((s) => s.requestSignoff);
  const reviewSignoff = useAppStore((s) => s.reviewSignoff);
  const [building, setBuilding] = useState(false);
  const [manifest, setManifest] = useState<PackageManifest | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  const counts = qcCounts(issues);
  const hasRequiredPhotos =
    report.photos.length >= GUIDELINES.minPhotos &&
    (["subject-front", "subject-rear", "subject-street"] as const).every((k) =>
      report.photos.some((p) => p.kind === k),
    );

  const isTrainee = user.role === "Trainee";
  const needsSignoff = isTrainee || report.signoff.state === "pending";
  const signoffOk = !isTrainee || report.signoff.state === "approved";
  const canBuild = counts.blockers === 0 && signoffOk;

  async function build() {
    // // SEAM: exportService — real MISMO 3.6 XML build + PDF render + ZIP.
    setBuilding(true);
    try {
      const m = await exportService.buildPackage(report);
      setManifest(m);
      setStatus(report.orderId, "Ready");
    } finally {
      setBuilding(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white">
        <h3 className="border-b border-zinc-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          UCDP package preflight
        </h3>
        <div className="divide-y divide-zinc-100">
          <CheckRow
            ok={counts.blockers === 0}
            label="MISMO 3.6 XML data file"
            detail={
              counts.blockers === 0
                ? "All required UAD fields present — dataset is XML-complete"
                : `${counts.blockers} blocker(s) must be resolved`
            }
            action={counts.blockers > 0 ? () => onNavigate(issues.find((i) => i.severity === "Blocker")!.sectionId, issues.find((i) => i.severity === "Blocker")!.field) : undefined}
          />
          <CheckRow ok label="Human-readable PDF" detail="Renders from the dynamic-URAR dataset (stub)" />
          <CheckRow
            ok={hasRequiredPhotos}
            label={`Image folder (${fmtNumber(report.photos.length)} photos)`}
            detail={hasRequiredPhotos ? "Front / rear / street present" : "Missing required photos or below minimum count"}
            action={!hasRequiredPhotos ? () => onNavigate("photos") : undefined}
          />
          <CheckRow
            ok={counts.warnings === 0}
            label={counts.warnings === 0 ? "No guideline warnings" : `${counts.warnings} guideline warning(s)`}
            detail="Warnings don't block export but commonly draw revision requests"
            soft
            action={counts.warnings > 0 ? () => onNavigate(issues.find((i) => i.severity === "Warning")!.sectionId, issues.find((i) => i.severity === "Warning")!.field) : undefined}
          />
          {needsSignoff && (
            <CheckRow
              ok={report.signoff.state === "approved"}
              label="Supervisor sign-off"
              detail={
                report.signoff.state === "approved"
                  ? `Approved${report.signoff.comment ? ` — “${report.signoff.comment}”` : ""}`
                  : report.signoff.state === "pending"
                    ? "Awaiting supervisor review"
                    : report.signoff.state === "changesRequested"
                      ? `Changes requested — “${report.signoff.comment ?? ""}”`
                      : "Trainee work requires supervisor sign-off before delivery (USPAP)"
              }
            />
          )}
        </div>
      </div>

      {/* role-gated actions */}
      <div className="flex flex-wrap items-center gap-3">
        {isTrainee && report.signoff.state !== "approved" && (
          <Button
            variant="primary"
            disabled={counts.blockers > 0 || report.signoff.state === "pending"}
            onClick={() => requestSignoff(report.orderId)}
            title={counts.blockers > 0 ? "Resolve blockers first" : undefined}
          >
            {report.signoff.state === "pending" ? "Sign-off requested…" : "Request supervisor sign-off"}
          </Button>
        )}
        <Button
          variant="primary"
          disabled={!canBuild || building}
          onClick={build}
          title={
            counts.blockers > 0
              ? `${counts.blockers} blocker(s) must be resolved first`
              : !signoffOk
                ? "Supervisor sign-off required"
                : undefined
          }
        >
          {building ? "Building package…" : "Build UCDP package"}
        </Button>
        {building && <Spinner />}
        {report.assignment.status === "Ready" && !building && (
          <Button onClick={() => setStatus(report.orderId, "Delivered")}>Mark delivered</Button>
        )}
      </div>

      {/* supervisor review panel */}
      {user.role === "Supervisor" && report.signoff.state === "pending" && (
        <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3">
          <h3 className="text-sm font-semibold text-zinc-800">Supervisor review</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Requested by {useAppStore.getState().users.find((u) => u.id === report.signoff.requestedById)?.name ?? "trainee"} — review the report and sign off.
          </p>
          <input
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Review comment (optional)"
            className="mt-2 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          />
          <div className="mt-2 flex gap-2">
            <Button variant="primary" onClick={() => reviewSignoff(report.orderId, true, reviewComment)}>
              Approve
            </Button>
            <Button variant="danger" onClick={() => reviewSignoff(report.orderId, false, reviewComment)}>
              Request changes
            </Button>
          </div>
        </div>
      )}

      {manifest && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-sm">
          <h3 className="font-semibold text-emerald-800">Package built (stub)</h3>
          <ul className="num mt-1.5 space-y-0.5 text-xs text-zinc-700">
            <li>📦 {manifest.fileName} · {fmtNumber(manifest.sizeKb)} KB</li>
            <li>— {manifest.xmlFile} (MISMO 3.6)</li>
            <li>— {manifest.pdfFile}</li>
            <li>— images/ ({manifest.imageCount} files)</li>
          </ul>
          <p className="mt-1.5 text-[11px] text-zinc-500">
            UCDP/EAD submission is a v1 seam — wire submissionService when ready.
          </p>
        </div>
      )}
    </div>
  );
}

function CheckRow({
  ok,
  label,
  detail,
  soft,
  action,
}: {
  ok: boolean;
  label: string;
  detail: string;
  soft?: boolean;
  action?: () => void;
}) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5">
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
          ok ? "bg-(--color-ok)" : soft ? "bg-(--color-warning)" : "bg-(--color-blocker)"
        }`}
      >
        {ok ? "✓" : "!"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-zinc-800">{label}</div>
        <div className="text-xs text-zinc-500">{detail}</div>
      </div>
      {action && (
        <button onClick={action} className="shrink-0 text-xs text-indigo-600 hover:underline">
          Fix →
        </button>
      )}
    </div>
  );
}
