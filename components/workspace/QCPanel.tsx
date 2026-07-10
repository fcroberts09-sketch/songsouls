"use client";
/**
 * Always-on compliance & QC panel — the product's trust surface.
 * Recomputed from the report on every edit; each issue is click-to-navigate.
 */
import type { QCIssue, QCSeverity } from "@/lib/types";
import { qcCounts } from "@/lib/qc/rules";
import { SeverityBadge } from "@/components/ui";

export function QCPanel({
  issues,
  onNavigate,
  onExplain,
}: {
  issues: QCIssue[];
  onNavigate: (sectionId: string, field?: string) => void;
  onExplain: (issue: QCIssue) => void;
}) {
  const counts = qcCounts(issues);
  const order: QCSeverity[] = ["Blocker", "Warning", "Note"];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Compliance & QC</h2>
        <div className="num flex gap-1.5 text-[11px] font-semibold">
          <span className={counts.blockers > 0 ? "text-(--color-blocker)" : "text-zinc-300"}>{counts.blockers}B</span>
          <span className={counts.warnings > 0 ? "text-(--color-warning)" : "text-zinc-300"}>{counts.warnings}W</span>
          <span className={counts.notes > 0 ? "text-zinc-500" : "text-zinc-300"}>{counts.notes}N</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {issues.length === 0 && (
          <div className="px-3 py-6 text-center">
            <div className="text-2xl">✓</div>
            <p className="mt-1 text-sm font-medium text-(--color-ok)">UCDP-ready</p>
            <p className="text-xs text-zinc-400">No issues found by the live rules engine.</p>
          </div>
        )}
        {order.map((sev) => {
          const group = issues.filter((i) => i.severity === sev);
          if (group.length === 0) return null;
          return (
            <div key={sev} className="border-b border-zinc-100 py-1">
              {group.map((issue) => (
                <div
                  key={issue.id}
                  className="group cursor-pointer px-3 py-1.5 hover:bg-zinc-50"
                  onClick={() => onNavigate(issue.sectionId, issue.field)}
                  title={issue.detail}
                >
                  <div className="flex items-start gap-1.5">
                    <SeverityBadge severity={sev} />
                    <p className="flex-1 text-xs leading-4 text-zinc-700">{issue.message}</p>
                  </div>
                  <div className="mt-0.5 hidden justify-end gap-2 text-[11px] group-hover:flex">
                    <button
                      className="text-violet-600 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExplain(issue);
                      }}
                    >
                      Explain
                    </button>
                    <span className="text-indigo-600">Go to field →</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
