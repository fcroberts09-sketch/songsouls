"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "pitchlab_api_key";

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || "";
    setApiKeyState(stored);
  }, []);

  const setApiKey = (key: string) => {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setApiKeyState(key.trim());
  };

  return { apiKey, setApiKey };
}

interface ApiKeyModalProps {
  onClose: () => void;
}

export function ApiKeyModal({ onClose }: ApiKeyModalProps) {
  const { apiKey, setApiKey } = useApiKey();
  const [input, setInput] = useState(apiKey);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync input when apiKey loads from localStorage (it starts as "" on first render)
  useEffect(() => {
    setInput(apiKey);
  }, [apiKey]);

  const handleSave = () => {
    setApiKey(input);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setInput("");
    setApiKey("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-slate-100 font-bold text-base">API Key Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <p className="text-slate-400 text-xs mb-4 leading-relaxed">
          Enter your{" "}
          <span className="text-blue-400">Anthropic API key</span> to run analysis with your
          own account. It&apos;s stored only in your browser&apos;s local storage and sent
          directly to this site&apos;s server over HTTPS — never shared or logged.
        </p>

        <div className="relative mb-3">
          <input
            type={show ? "text" : "password"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="sk-ant-api03-..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pr-20 text-slate-100 text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            spellCheck={false}
            autoComplete="off"
          />
          <button
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>

        {input && (
          <p className="text-slate-500 text-[11px] mb-4">
            Stored in <code className="text-slate-400">localStorage</code> — clears if you clear browser data.
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg py-2 transition-colors"
          >
            {saved ? "Saved!" : "Save Key"}
          </button>
          {apiKey && (
            <button
              onClick={handleClear}
              className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <p className="text-slate-600 text-[11px] mt-4 text-center">
          Get a key at console.anthropic.com
        </p>
      </div>
    </div>
  );
}
