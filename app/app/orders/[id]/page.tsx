"use client";
/**
 * Report workspace: dynamic section rail (left), section content (center),
 * always-on Compliance & QC panel + AI drawer (right). The top bar's primary
 * CTA always reflects the next blocking action.
 */
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useReport, useCurrentUser } from "@/lib/store";
import { deriveSections } from "@/lib/uad/fields";
import { runQC, qcCounts, completenessPct, complianceHealth } from "@/lib/qc/rules";
import { llmService } from "@/lib/services";
import type { QCIssue } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { StatusDot } from "@/components/ui";
import { QCPanel } from "@/components/workspace/QCPanel";
import { AIDrawer } from "@/components/workspace/AIDrawer";
import { FieldsSection } from "@/components/workspace/FieldsSection";
import { CompGridSection } from "@/components/workspace/CompGrid";
import { AdjustmentsSection } from "@/components/workspace/AdjustmentsSection";
import { CommentarySection } from "@/components/workspace/CommentarySection";
import { PhotosSection } from "@/components/workspace/PhotosSection";
import { ExportSection } from "@/components/workspace/ExportSection";
import {
  AssignmentSection,
  ReconciliationSection,
  SketchSection,
  WorkfileSection,
} from "@/components/workspace/MiscSections";

export default function ReportWorkspace() {
  const { id } = useParams<{ id: string }>();
  const report = useReport(id);
  const user = useCurrentUser();
  const [activeSection, setActiveSection] = useState("subject");
  const [focusField, setFocusField] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [explainText, setExplainText] = useState<string | null>(null);

  const issues = useMemo(() => (report ? runQC(report) : []), [report]);
  const sections = useMemo(() => (report ? deriveSections(report) : []), [report]);
  const completeness = report ? completenessPct(report) : 0;
  const counts = qcCounts(issues);

  function navigateTo(sectionId: string, field?: string) {
    setActiveSection(sectionId);
    setFocusField(field ?? null);
    if (field) setTimeout(() => setFocusField(null), 2500);
  }

  async function explainIssue(issue: QCIssue) {
    if (!report) return;
    setAiOpen(true);
    setExplainText("Thinking…");
    setExplainText(await llmService.explainIssue(report, issue));
  }

  // keyboard: [ / ] cycle sections, . toggles AI drawer (ignored while typing)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      const idx = sections.findIndex((s) => s.id === activeSection);
      if (e.key === "]") setActiveSection(sections[Math.min(idx + 1, sections.length - 1)]?.id ?? activeSection);
      else if (e.key === "[") setActiveSection(sections[Math.max(idx - 1, 0)]?.id ?? activeSection);
      else if (e.key === ".") setAiOpen((o) => !o);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sections, activeSection]);

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
          Order not found. <Link className="ml-1 text-indigo-600 underline" href="/app">Back to orders</Link>
        </div>
      </div>
    );
  }

  // primary CTA reflects the next blocking action
  const firstBlocker = issues.find((i) => i.severity === "Blocker");
  const commentaryEmpty = report.commentary.some((b) => b.text.trim() === "");
  const cta = firstBlocker
    ? { label: `Resolve ${counts.blockers} issue${counts.blockers > 1 ? "s" : ""}`, run: () => navigateTo(firstBlocker.sectionId, firstBlocker.field) }
    : commentaryEmpty
      ? { label: "Generate commentary", run: () => navigateTo("commentary") }
      : { label: "Build UCDP package", run: () => navigateTo("export") };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppHeader />

      {/* status bar */}
      <div className="flex h-12 shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-4">
        <Link href="/app" className="text-xs text-zinc-400 hover:text-zinc-700">← Orders</Link>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold leading-4">
            #{report.orderId} · {report.subject.address.value ?? "(no address)"}
          </div>
          <div className="text-[11px] text-zinc-500">
            {report.assignment.productVariant} · {report.assignment.client} · {report.assignment.status}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2" title="Report completeness">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-200">
              <div className="num h-full bg-(--color-accent) transition-all" style={{ width: `${completeness}%` }} />
            </div>
            <span className="num text-xs font-medium text-zinc-600">{completeness}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <StatusDot health={complianceHealth(issues)} />
            <span className="num text-zinc-600">
              {counts.blockers} blockers · {counts.warnings} warnings
            </span>
          </div>
          <Link href={`/app/orders/${report.orderId}/inspect`} className="text-xs text-indigo-600 hover:underline">
            Inspect 📱
          </Link>
          <button
            onClick={cta.run}
            className="rounded-md bg-(--color-accent) px-3 py-1.5 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
          >
            {cta.label}
          </button>
        </div>
      </div>

      {/* sign-off banners */}
      {report.signoff.state === "changesRequested" && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-800">
          Supervisor requested changes{report.signoff.comment ? `: “${report.signoff.comment}”` : ""} — resolve and re-request sign-off from the Export section.
        </div>
      )}
      {report.signoff.state === "pending" && user.role === "Supervisor" && (
        <div className="shrink-0 border-b border-violet-200 bg-violet-50 px-4 py-1.5 text-xs text-violet-800">
          This trainee report awaits your sign-off — review and approve in the{" "}
          <button className="underline" onClick={() => navigateTo("export")}>Export section</button>.
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* dynamic section rail */}
        <nav className="w-48 shrink-0 overflow-y-auto border-r border-zinc-200 bg-white py-2">
          {sections.map((s) => {
            const sectionIssues = issues.filter((i) => i.sectionId === s.id);
            const b = sectionIssues.filter((i) => i.severity === "Blocker").length;
            const w = sectionIssues.filter((i) => i.severity === "Warning").length;
            return (
              <button
                key={s.id}
                onClick={() => navigateTo(s.id)}
                title={s.reason}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] ${
                  activeSection === s.id
                    ? "border-r-2 border-(--color-accent) bg-indigo-50/70 font-medium text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <span className="flex items-center gap-1">
                  {s.title}
                  {s.reason && <span className="text-[9px] text-indigo-400" title={s.reason}>◆</span>}
                </span>
                {(b > 0 || w > 0) && (
                  <span className={`num rounded px-1 text-[10px] font-bold ${b > 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                    {b > 0 ? b : w}
                  </span>
                )}
              </button>
            );
          })}
          <div className="mt-4 px-3 text-[10px] leading-4 text-zinc-300">
            [ ] switch section · . AI drawer
          </div>
        </nav>

        {/* section content */}
        <main className="min-w-0 flex-1 overflow-y-auto p-5">
          <h1 className="mb-1 text-base font-semibold">
            {sections.find((s) => s.id === activeSection)?.title}
          </h1>
          {sections.find((s) => s.id === activeSection)?.reason && (
            <p className="mb-3 text-[11px] text-indigo-500">
              ◆ {sections.find((s) => s.id === activeSection)?.reason} (dynamic URAR)
            </p>
          )}
          <div className="mt-3">
            {activeSection === "assignment" && <AssignmentSection report={report} />}
            {["subject", "improvements", "project", "manufactured", "rentSchedule"].includes(activeSection) && (
              <FieldsSection report={report} sectionId={activeSection} focusField={focusField} />
            )}
            {activeSection === "sketch" && <SketchSection report={report} />}
            {activeSection === "comps" && <CompGridSection report={report} />}
            {activeSection === "adjustments" && <AdjustmentsSection report={report} />}
            {activeSection === "commentary" && <CommentarySection report={report} focusField={focusField} />}
            {activeSection === "reconciliation" && <ReconciliationSection report={report} />}
            {activeSection === "photos" && <PhotosSection report={report} />}
            {activeSection === "workfile" && <WorkfileSection report={report} />}
            {activeSection === "export" && (
              <ExportSection report={report} issues={issues} onNavigate={navigateTo} />
            )}
          </div>
        </main>

        {/* right rail: QC always on, AI drawer collapsible */}
        <aside className="flex w-80 shrink-0 flex-col border-l border-zinc-200 bg-white">
          <div className={aiOpen ? "min-h-0 flex-1" : "min-h-0 flex-1"}>
            <QCPanel issues={issues} onNavigate={navigateTo} onExplain={explainIssue} />
          </div>
          {aiOpen ? (
            <div className="h-2/5 min-h-56">
              <AIDrawer report={report} issues={issues} explainText={explainText} onClose={() => setAiOpen(false)} />
            </div>
          ) : (
            <button
              onClick={() => setAiOpen(true)}
              className="shrink-0 border-t border-zinc-200 px-3 py-2 text-left text-xs font-medium text-violet-700 hover:bg-violet-50"
            >
              ✦ AI assistant
              {report.suggestions.filter((s) => s.status === "pending").length > 0 && (
                <span className="num ml-1.5 rounded-full bg-violet-100 px-1.5 text-[10px] font-bold">
                  {report.suggestions.filter((s) => s.status === "pending").length}
                </span>
              )}
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
