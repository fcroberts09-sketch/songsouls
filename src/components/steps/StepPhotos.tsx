"use client";

import { useRef, useState, useCallback } from "react";
import type { UploadedPhoto } from "@/types/order";

interface StepPhotosProps {
  photos: UploadedPhoto[];
  setPhotos: (photos: UploadedPhoto[]) => void;
}

const MAX_PHOTOS = 3;
const MAX_BYTES = 6 * 1024 * 1024; // 6MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

/**
 * Resize an image to max dimension to keep payloads reasonable.
 * Returns a base64 JPEG data URL.
 */
async function resizeImage(file: File, maxDim = 1600, quality = 0.82): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas failed"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = dataUrl;
  });
}

export default function StepPhotos({ photos, setPhotos }: StepPhotosProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      setBusy(true);

      const incoming = Array.from(files);
      const remaining = MAX_PHOTOS - photos.length;
      if (incoming.length > remaining) {
        setError(`You can add up to ${MAX_PHOTOS} photos. Skipping the extras.`);
        incoming.length = remaining;
      }

      const next: UploadedPhoto[] = [];
      for (const file of incoming) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(`${file.name} isn't a supported image type.`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError(`${file.name} is over 6MB. Try compressing it first.`);
          continue;
        }
        try {
          const src = await resizeImage(file);
          next.push({ src, filename: file.name });
        } catch {
          setError(`Couldn't read ${file.name}. Try a different image.`);
        }
      }

      setPhotos([...photos, ...next]);
      setBusy(false);
    },
    [photos, setPhotos]
  );

  const removePhoto = (idx: number) => {
    const next = [...photos];
    next.splice(idx, 1);
    setPhotos(next);
  };

  const updateCaption = (idx: number, caption: string) => {
    const next = [...photos];
    next[idx] = { ...next[idx], caption };
    setPhotos(next);
  };

  return (
    <div>
      <header className="mb-8 text-center">
        <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
          Step 3 of 5
        </div>
        <h2 className="font-display text-3xl md:text-5xl text-cream-100 mb-3">
          Photos (optional)
        </h2>
        <p className="text-cream-200/60 max-w-lg mx-auto">
          Up to three photos that show who they are — a portrait, them hiking, doing the thing they love.
          We use these to inform the lyrics, not to be in the song. You can skip this step if you&rsquo;d rather not share.
        </p>
      </header>

      <div className="max-w-2xl mx-auto">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all p-8 sm:p-10 text-center ${
            dragging
              ? "border-gold-400 bg-gold-400/10"
              : "border-cream-100/15 hover:border-cream-100/30 bg-ink-900/40 active:bg-ink-900/60"
          }`}
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gold-400/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-gold-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <p className="text-cream-100 font-medium">
            {dragging ? (
              "Drop them here"
            ) : (
              <>
                <span className="hidden sm:inline">Drag photos here, or click to browse</span>
                <span className="sm:hidden">Tap to add photos</span>
              </>
            )}
          </p>
          <p className="text-xs text-cream-200/45 mt-1 px-2">
            JPG, PNG, WEBP &middot; up to 6MB each &middot; up to {MAX_PHOTOS} photos
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {busy && (
          <div className="text-center text-sm text-cream-200/60 mt-3">
            Reading your photos…
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-400/30 text-sm text-rose-300">
            {error}
          </div>
        )}

        {photos.length > 0 && (
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            {photos.map((p, i) => (
              <div key={i} className="card-deep rounded-xl overflow-hidden">
                <div className="relative aspect-video bg-ink-900">
                  <img src={p.src} alt={p.filename || `photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-2 right-2 w-11 h-11 rounded-full bg-ink-950/80 backdrop-blur-sm border border-cream-100/20 text-cream-100 hover:bg-rose-500/80 flex items-center justify-center transition-colors"
                    aria-label="Remove photo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-3">
                  <input
                    type="text"
                    value={p.caption || ""}
                    onChange={(e) => updateCaption(i, e.target.value)}
                    placeholder="Caption (optional) — who, when, where"
                    maxLength={200}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
