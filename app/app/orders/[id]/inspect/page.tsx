"use client";
/**
 * Mobile inspection view — optimized for one-handed field use: big touch
 * targets, photo capture with labeling, condition/quality entry with inline
 * UAD definitions, GLA quick entry, sketch notes.
 */
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppStore, useReport } from "@/lib/store";
import {
  CONDITION_DEFS,
  CONDITION_RATINGS,
  QUALITY_DEFS,
  QUALITY_RATINGS,
} from "@/lib/uad/fields";
import { llmService } from "@/lib/services";
import { uid } from "@/lib/format";
import type { PhotoKind } from "@/lib/types";

const QUICK_KINDS: { value: PhotoKind; label: string }[] = [
  { value: "subject-front", label: "Front" },
  { value: "subject-rear", label: "Rear" },
  { value: "subject-street", label: "Street" },
  { value: "interior", label: "Interior" },
  { value: "deficiency", label: "Deficiency" },
];

export default function InspectionView() {
  const { id } = useParams<{ id: string }>();
  const report = useReport(id);
  const setSubjectField = useAppStore((s) => s.setSubjectField);
  const setStatus = useAppStore((s) => s.setStatus);
  const setEffectiveDate = useAppStore((s) => s.setAssignmentEffectiveDate);
  const addPhoto = useAppStore((s) => s.addPhoto);
  const updatePhoto = useAppStore((s) => s.updatePhoto);
  const setSketchNotes = useAppStore((s) => s.setSketchNotes);
  const [nextKind, setNextKind] = useState<PhotoKind>("subject-front");
  const [labeling, setLabeling] = useState<string | null>(null);

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Order not found. <Link href="/app" className="ml-1 text-indigo-600 underline">Back</Link>
      </div>
    );
  }

  const s = report.subject;
  const inspected = report.assignment.effectiveDate != null;

  function startInspection() {
    setEffectiveDate(id, new Date().toISOString());
    if (report!.assignment.status === "New") setStatus(id, "Inspected");
  }

  function onCapture(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      addPhoto(id, {
        id: uid("p"),
        kind: nextKind,
        label: QUICK_KINDS.find((k) => k.value === nextKind)?.label ?? "Photo",
        takenAt: new Date().toISOString(),
        url: URL.createObjectURL(f),
        labelProvenance: { source: "Inspection", timestamp: new Date().toISOString() },
      });
    }
  }

  async function aiLabel(photoId: string) {
    // // SEAM: llmService vision — field labeling, applied directly here for
    // speed but stamped with AI provenance and overridable like everything else.
    setLabeling(photoId);
    try {
      const photo = report!.photos.find((p) => p.id === photoId)!;
      const result = await llmService.labelPhoto(photo);
      updatePhoto(id, photoId, {
        label: result.label,
        kind: result.kind,
        labelProvenance: { source: "AI", timestamp: new Date().toISOString(), confidence: result.confidence },
      });
    } finally {
      setLabeling(null);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-zinc-50 pb-28">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href={`/app/orders/${id}`} className="text-xs text-zinc-400">← Workspace</Link>
          <span className="text-[11px] text-zinc-400">Inspection mode</span>
        </div>
        <h1 className="mt-0.5 truncate text-base font-semibold">{s.address.value ?? `Order #${id}`}</h1>
        <p className="text-xs text-zinc-500">{report.assignment.productVariant}</p>
      </header>

      <main className="space-y-4 px-4 py-4">
        {!inspected ? (
          <button
            onClick={startInspection}
            className="w-full rounded-xl bg-(--color-accent) py-4 text-base font-semibold text-white active:scale-[0.99]"
          >
            Start inspection — set effective date to now
          </button>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" suppressHydrationWarning>
            Effective date: {new Date(report.assignment.effectiveDate!).toLocaleDateString()}
          </div>
        )}

        {/* photos */}
        <section className="rounded-xl border border-zinc-200 bg-white p-3">
          <h2 className="text-sm font-semibold">Photos ({report.photos.length})</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_KINDS.map((k) => (
              <button
                key={k.value}
                onClick={() => setNextKind(k.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  nextKind === k.value ? "bg-(--color-accent) text-white" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
          <label className="mt-3 block">
            <span className="block w-full cursor-pointer rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50/50 py-5 text-center text-sm font-medium text-indigo-700 active:bg-indigo-100">
              📷 Capture “{QUICK_KINDS.find((k) => k.value === nextKind)?.label}”
            </span>
            <input type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => onCapture(e.target.files)} />
          </label>
          {report.photos.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {report.photos.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-lg border border-zinc-200">
                  {p.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.url} alt={p.label} className="h-16 w-full object-cover" />
                  ) : (
                    <div className="flex h-16 items-center justify-center bg-zinc-100 text-[10px] text-zinc-400">{p.label}</div>
                  )}
                  <div className="truncate px-1 py-0.5 text-[10px] text-zinc-600">{p.label}</div>
                  <button
                    onClick={() => aiLabel(p.id)}
                    disabled={labeling === p.id}
                    className="w-full bg-violet-50 py-1 text-[10px] font-medium text-violet-700 active:bg-violet-100"
                  >
                    {labeling === p.id ? "…" : "✦ AI label"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* condition / quality */}
        <section className="rounded-xl border border-zinc-200 bg-white p-3">
          <h2 className="text-sm font-semibold">Condition</h2>
          <div className="mt-2 grid grid-cols-6 gap-1.5">
            {CONDITION_RATINGS.map((r) => (
              <button
                key={r}
                onClick={() => setSubjectField(id, "condition", r, "Inspection")}
                className={`rounded-lg py-3 text-sm font-bold ${
                  s.condition.value === r ? "bg-(--color-accent) text-white" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {s.condition.value && (
            <p className="mt-2 text-xs leading-4 text-zinc-500">{CONDITION_DEFS[s.condition.value]}</p>
          )}
          <h2 className="mt-4 text-sm font-semibold">Quality</h2>
          <div className="mt-2 grid grid-cols-6 gap-1.5">
            {QUALITY_RATINGS.map((r) => (
              <button
                key={r}
                onClick={() => setSubjectField(id, "quality", r, "Inspection")}
                className={`rounded-lg py-3 text-sm font-bold ${
                  s.quality.value === r ? "bg-(--color-accent) text-white" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {s.quality.value && (
            <p className="mt-2 text-xs leading-4 text-zinc-500">{QUALITY_DEFS[s.quality.value]}</p>
          )}
        </section>

        {/* quick measurements */}
        <section className="rounded-xl border border-zinc-200 bg-white p-3">
          <h2 className="text-sm font-semibold">Quick entry</h2>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <QuickNumber label="GLA (sf, ANSI)" value={s.gla.value} onCommit={(v) => setSubjectField(id, "gla", v, "Inspection")} />
            <QuickNumber label="Bedrooms" value={s.bedrooms.value} onCommit={(v) => setSubjectField(id, "bedrooms", v, "Inspection")} />
            <QuickNumber label="Full baths" value={s.bathsFull.value} onCommit={(v) => setSubjectField(id, "bathsFull", v, "Inspection")} />
            <QuickNumber label="Total rooms" value={s.roomCount.value} onCommit={(v) => setSubjectField(id, "roomCount", v, "Inspection")} />
          </div>
          <label className="mt-3 block text-xs font-medium text-zinc-600">Sketch notes</label>
          <textarea
            defaultValue={s.sketch.notes}
            onBlur={(e) => setSketchNotes(id, e.target.value)}
            rows={3}
            placeholder="Measurement notes, ANSI exceptions, below-grade areas…"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </section>
      </main>

      {/* one-handed bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-zinc-200 bg-white px-4 py-3">
        <div className="flex gap-2">
          <Link
            href={`/app/orders/${id}`}
            className="flex-1 rounded-xl border border-zinc-300 py-3 text-center text-sm font-medium text-zinc-700"
          >
            Open report
          </Link>
          <button
            onClick={() => setStatus(id, "Inspected")}
            disabled={!inspected}
            className="flex-1 rounded-xl bg-(--color-accent) py-3 text-sm font-semibold text-white disabled:bg-zinc-300"
          >
            Mark inspected ✓
          </button>
        </div>
      </nav>
    </div>
  );
}

function QuickNumber({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number | null;
  onCommit: (v: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        defaultValue={value ?? ""}
        onBlur={(e) => onCommit(e.target.value === "" ? null : Number(e.target.value))}
        className="num mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-base"
      />
    </label>
  );
}
