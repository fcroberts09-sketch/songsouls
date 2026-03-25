"use client";

import { useState, useEffect } from "react";
import type { AnalysisResult } from "@/types/analysis";

interface ReportActionsProps {
  analysis: AnalysisResult;
}

export function ReportActions({ analysis }: ReportActionsProps) {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    // Feature-detect native share on mount (client only)
    import("@/lib/share-utils").then(({ canNativeShare }) => {
      setShowShare(canNativeShare());
    });
  }, []);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const [{ generateReport }, { downloadPdf }] = await Promise.all([
        import("@/lib/pdf-report"),
        import("@/lib/share-utils"),
      ]);
      const doc = generateReport(analysis);
      downloadPdf(doc, analysis);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    setGenerating(true);
    try {
      const [{ generateReport }, { sharePdf, downloadPdf }] = await Promise.all([
        import("@/lib/pdf-report"),
        import("@/lib/share-utils"),
      ]);
      const doc = generateReport(analysis);
      const shared = await sharePdf(doc, analysis);
      if (!shared) {
        // Fallback to download if share cancelled/failed
        downloadPdf(doc, analysis);
      }
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      const { copyTextSummary } = await import("@/lib/share-utils");
      const ok = await copyTextSummary(analysis);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {/* Download PDF — always visible */}
      <button
        onClick={handleDownload}
        disabled={generating}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
      >
        {generating ? (
          <>
            <Spinner />
            Generating...
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Report
          </>
        )}
      </button>

      {/* Native Share — mobile only */}
      {showShare && (
        <button
          onClick={handleShare}
          disabled={generating}
          className="inline-flex items-center gap-2 border border-blue-500/40 text-blue-400 hover:bg-blue-950/40 disabled:opacity-60 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share
        </button>
      )}

      {/* Copy Summary — always visible */}
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 border border-slate-700 text-slate-400 hover:bg-slate-800/60 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
      >
        {copied ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span className="text-green-400">Copied!</span>
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy Summary
          </>
        )}
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
