"use client";

import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  src: string;
  title: string;
  /** Optional onPlay callback so parent can sync UI (only one player at a time) */
  onPlay?: () => void;
  /** Compact variant for use inside cards */
  compact?: boolean;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ src, title, onPlay, compact }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => {
      setDuration(audio.duration || 0);
      setLoaded(true);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    const onErr = () => setError(true);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onErr);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onErr);
    };
  }, [src]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio || error) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => setError(true));
      setPlaying(true);
      onPlay?.();
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * duration;
    setProgress(audio.currentTime);
  };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  if (error) {
    return (
      <div className={`text-xs text-cream-200/50 italic ${compact ? "py-2" : "py-4"}`}>
        Audio file not found. Drop an MP3 at <code>{src}</code> to enable playback.
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${compact ? "" : "p-1"}`}>
      <audio ref={audioRef} src={src} preload="metadata" aria-label={title} />

      <button
        onClick={toggle}
        className={`flex-shrink-0 ${
          compact ? "w-10 h-10" : "w-12 h-12"
        } rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-ink-950 flex items-center justify-center shadow-lg shadow-gold-700/30 hover:scale-105 transition-transform`}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <svg className={compact ? "w-4 h-4" : "w-5 h-5"} fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
          </svg>
        ) : (
          <svg className={compact ? "w-4 h-4 ml-0.5" : "w-5 h-5 ml-0.5"} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div
          onClick={seek}
          className="relative h-1.5 bg-cream-100/10 rounded-full cursor-pointer group overflow-hidden"
        >
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold-400 to-gold-300 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cream-50 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            style={{ left: `calc(${pct}% - 6px)` }}
          />
        </div>
        <div className={`flex justify-between mt-1.5 ${compact ? "text-[10px]" : "text-xs"} text-cream-200/50`}>
          <span>{formatTime(progress)}</span>
          <span>{loaded ? formatTime(duration) : "—:—"}</span>
        </div>
      </div>
    </div>
  );
}
