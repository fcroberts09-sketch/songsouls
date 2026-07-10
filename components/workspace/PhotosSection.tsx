"use client";
/** Photo manager: capture/import, label (manually or via AI vision seam). */
import { useRef, useState } from "react";
import type { AppraisalReport, PhotoKind, PhotoRecord } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { llmService } from "@/lib/services";
import { uid } from "@/lib/format";
import { Button, ProvenanceChip } from "@/components/ui";
import { SuggestionCard } from "./SuggestionCard";

const KINDS: { value: PhotoKind; label: string }[] = [
  { value: "subject-front", label: "Subject — front" },
  { value: "subject-rear", label: "Subject — rear" },
  { value: "subject-street", label: "Subject — street" },
  { value: "interior", label: "Interior" },
  { value: "deficiency", label: "Deficiency" },
  { value: "comp", label: "Comparable" },
  { value: "other", label: "Other" },
];

export function PhotosSection({ report }: { report: AppraisalReport }) {
  const addPhoto = useAppStore((s) => s.addPhoto);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFiles(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      addPhoto(report.orderId, {
        id: uid("p"),
        kind: "other",
        label: f.name.replace(/\.[a-z]+$/i, ""),
        takenAt: new Date().toISOString(),
        url: URL.createObjectURL(f),
        labelProvenance: { source: "Appraiser", timestamp: new Date().toISOString() },
      });
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Button variant="primary" onClick={() => fileRef.current?.click()}>
          Add photos
        </Button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        <span className="text-[11px] text-zinc-400">
          The UCDP package needs front / rear / street at minimum. AI labels are suggestions until accepted.
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {report.photos.map((p) => (
          <PhotoCard key={p.id} report={report} photo={p} />
        ))}
        {report.photos.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-zinc-400">
            No photos yet — add them here or capture from the mobile inspection view.
          </p>
        )}
      </div>
    </div>
  );
}

function PhotoCard({ report, photo }: { report: AppraisalReport; photo: PhotoRecord }) {
  const updatePhoto = useAppStore((s) => s.updatePhoto);
  const addSuggestions = useAppStore((s) => s.addSuggestions);
  const [busy, setBusy] = useState(false);

  const pendingLabel = report.suggestions.find(
    (s) => s.status === "pending" && s.target.kind === "photoLabel" && s.target.photoId === photo.id,
  );

  async function aiLabel() {
    // // SEAM: llmService vision — classify the image; lands as a suggestion.
    setBusy(true);
    try {
      const result = await llmService.labelPhoto(photo);
      addSuggestions(report.orderId, [
        {
          id: uid("sug"),
          target: { kind: "photoLabel", photoId: photo.id },
          label: "Photo label",
          value: { label: result.label, kind: result.kind },
          display: result.label,
          rationale: `Vision model classified this image as "${result.label}" (${(result.confidence * 100).toFixed(0)}% confidence).`,
          sourcesUsed: [`photos.${photo.id}`],
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      {photo.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.url} alt={photo.label} className="h-28 w-full object-cover" />
      ) : (
        <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-zinc-200 to-zinc-300 text-xs text-zinc-500">
          {photo.label || "Photo"}
        </div>
      )}
      <div className="space-y-1.5 p-2">
        <input
          value={photo.label}
          onChange={(e) =>
            updatePhoto(report.orderId, photo.id, {
              label: e.target.value,
              labelProvenance: { source: "Appraiser", timestamp: new Date().toISOString() },
            })
          }
          className="w-full rounded border border-zinc-200 px-1.5 py-1 text-xs"
        />
        <select
          value={photo.kind}
          onChange={(e) => updatePhoto(report.orderId, photo.id, { kind: e.target.value as PhotoKind })}
          className="w-full rounded border border-zinc-200 px-1 py-1 text-[11px] text-zinc-600"
        >
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </select>
        <div className="flex items-center justify-between">
          <ProvenanceChip provenance={photo.labelProvenance} />
          <Button variant="ghost" onClick={aiLabel} disabled={busy || !!pendingLabel}>
            {busy ? "…" : "AI label"}
          </Button>
        </div>
        {pendingLabel && <SuggestionCard orderId={report.orderId} suggestion={pendingLabel} compact />}
      </div>
    </div>
  );
}
