"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/types/analysis";
import { PhaseBar } from "./PhaseBar";
import { DrillCard } from "./DrillCard";
import { ReportActions } from "./ReportActions";

interface AnalysisResultsProps {
  analysis: AnalysisResult;
}

type TabKey = "mechanics" | "issues" | "drills" | "plan";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "mechanics", label: "Mechanics", icon: "\uD83D\uDCCA" },
  { key: "issues", label: "Issues", icon: "\u26A0\uFE0F" },
  { key: "drills", label: "Drills", icon: "\uD83C\uDFCB\uFE0F" },
  { key: "plan", label: "Plan", icon: "\uD83D\uDCC5" },
];

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const [tab, setTab] = useState<TabKey>("mechanics");

  const issueColors = ["border-l-red-400", "border-l-amber-400", "border-l-blue-400"];
  const issueBgColors = ["bg-red-950/40", "bg-amber-950/40", "bg-blue-950/40"];
  const issueTextColors = ["text-red-400", "text-amber-400", "text-blue-400"];

  return (
    <div>
      {/* Validation confidence banner */}
      {analysis.validation_confidence === "low" && (
        <div className="bg-red-950/30 border border-red-900/40 rounded-lg px-4 py-3 mb-4 text-xs text-red-400">
          <span className="font-bold">Low video confidence:</span> The AI had difficulty clearly seeing several phases in this footage. Results may be less reliable — consider re-filming from a side angle with better lighting.
          {analysis.validation_flags && analysis.validation_flags.length > 0 && (
            <ul className="mt-1.5 list-disc list-inside text-red-500/80">
              {analysis.validation_flags.map((flag, i) => <li key={i}>{flag}</li>)}
            </ul>
          )}
        </div>
      )}
      {analysis.validation_confidence === "medium" && analysis.validation_flags && analysis.validation_flags.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg px-4 py-3 mb-4 text-xs text-amber-400/80">
          <span className="font-bold">Note:</span> Some observations could not be fully confirmed from the footage.
          <ul className="mt-1 list-disc list-inside">
            {analysis.validation_flags.map((flag, i) => <li key={i}>{flag}</li>)}
          </ul>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-slate-900/80 to-blue-950/30 border border-blue-900/40 rounded-xl p-5 mb-5">
        <p className="text-slate-400 text-sm leading-relaxed m-0">
          {analysis.overall_summary}
        </p>

        {analysis.pitcher_age_note && (
          <p className="text-slate-500 text-xs mt-2 italic">{analysis.pitcher_age_note}</p>
        )}

        {analysis.encouragement && (
          <div className="mt-3 bg-blue-950/40 rounded-md px-3 py-2 border-l-2 border-blue-500">
            <p className="text-blue-400 text-xs italic m-0">
              &#128172; {analysis.encouragement}
            </p>
          </div>
        )}
      </div>

      {/* Report Actions */}
      <ReportActions analysis={analysis} />

      {/* Tabs */}
      <div
        className="flex gap-1 mb-5 border-b border-slate-800"
        role="tablist"
        aria-label="Analysis sections"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            onClick={() => setTab(t.key)}
            className={`bg-transparent border-none border-b-2 px-3 py-2 cursor-pointer text-xs font-mono uppercase tracking-wider transition-all ${
              tab === t.key
                ? "border-b-blue-500 text-slate-200 font-bold"
                : "border-b-transparent text-slate-500 hover:text-slate-400"
            }`}
          >
            <span className="mr-1">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {tab === "mechanics" && (
        <div id="panel-mechanics" role="tabpanel" aria-labelledby="tab-mechanics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
              {analysis.phases
                .slice(0, Math.ceil(analysis.phases.length / 2))
                .map((p, i) => (
                  <PhaseBar key={i} phase={p} />
                ))}
            </div>
            <div>
              {analysis.phases
                .slice(Math.ceil(analysis.phases.length / 2))
                .map((p, i) => (
                  <PhaseBar key={i} phase={p} />
                ))}
            </div>
          </div>
        </div>
      )}

      {tab === "issues" && (
        <div id="panel-issues" role="tabpanel" aria-labelledby="tab-issues">
          {analysis.top_issues.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">
              No major issues identified — great mechanics!
            </p>
          ) : (
            analysis.top_issues.map((issue, i) => (
              <div
                key={i}
                className={`bg-slate-900 border border-slate-800 rounded-xl p-4 mb-3 border-l-[3px] ${
                  issueColors[i] || issueColors[2]
                }`}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className={`${issueBgColors[i] || issueBgColors[2]} ${
                      issueTextColors[i] || issueTextColors[2]
                    } rounded px-2 py-0.5 text-[10px] font-mono font-bold`}
                  >
                    #{i + 1} PRIORITY
                  </span>
                  <span className="text-slate-200 font-bold text-sm">{issue.issue}</span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-2">
                  {issue.description}
                </p>

                <div className="bg-slate-950/50 rounded px-3 py-1.5">
                  <span className="text-slate-600 text-[10px] uppercase tracking-widest">
                    Impact:{" "}
                  </span>
                  <span className="text-slate-400 text-xs">{issue.impact}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "drills" && (
        <div id="panel-drills" role="tabpanel" aria-labelledby="tab-drills">
          <div className="mb-3 text-slate-500 text-xs uppercase tracking-widest">
            {analysis.drills.length} drill{analysis.drills.length !== 1 ? "s" : ""} assigned
            based on your mechanics
          </div>

          {[...analysis.drills]
            .sort((a, b) => {
              const order = { high: 0, medium: 1, low: 2 };
              return order[a.priority] - order[b.priority];
            })
            .map((d, i) => (
              <DrillCard key={i} drill={d} />
            ))}
        </div>
      )}

      {tab === "plan" && (
        <div id="panel-plan" role="tabpanel" aria-labelledby="tab-plan">
          {analysis.weekly_plan.map((day, i) => {
            const parts = day.day.split(" ");
            const dayNum = parts[0] + " " + (parts[1] || "");
            const dayName = day.day.match(/\(([^)]+)\)/)?.[1] || "";

            return (
              <div
                key={i}
                className="flex gap-4 mb-3 bg-slate-900 border border-slate-800 rounded-lg p-3.5"
              >
                <div className="min-w-[70px] text-center bg-slate-950/60 rounded-md px-2 py-2 shrink-0">
                  <div className="text-blue-400 text-[10px] uppercase tracking-widest font-mono">
                    {dayNum}
                  </div>
                  <div className="text-slate-500 text-[9px]">{dayName}</div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-slate-200 font-bold text-sm mb-1.5">{day.focus}</div>
                  <ul className="m-0 p-0 list-none">
                    {day.activities.map((activity, j) => (
                      <li
                        key={j}
                        className="text-slate-500 text-xs mb-1 pl-3 relative"
                      >
                        <span className="absolute left-0 text-blue-700">&rsaquo;</span>
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
