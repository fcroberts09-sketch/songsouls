"use client";

import type { Genre } from "@/lib/genres";

interface StepQuestionsProps {
  genre: Genre;
  answers: Record<string, string>;
  setAnswer: (id: string, value: string) => void;
}

export default function StepQuestions({ genre, answers, setAnswer }: StepQuestionsProps) {
  return (
    <div>
      <header className="mb-8 text-center">
        <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
          Step 4 of 5
        </div>
        <h2 className="font-display text-3xl md:text-5xl text-cream-100 mb-3">
          Tell us about them.
        </h2>
        <p className="text-cream-200/60 max-w-lg mx-auto">
          The more specific, the better. Small details make the song feel like only it could have been written for them.
        </p>
      </header>

      <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6">
        {genre.questions.map((q, i) => (
          <div key={q.id} className="card-deep rounded-xl p-4 sm:p-5">
            <label className="block">
              <div className="flex items-baseline gap-2.5 sm:gap-3 mb-1">
                <span className="font-display text-gold-300 text-lg w-6 flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-cream-100 font-medium leading-snug">
                  {q.prompt}
                  {q.required && <span className="text-gold-400 ml-1">*</span>}
                </span>
              </div>
              {q.helper && (
                <p className="text-xs text-cream-200/50 ml-0 sm:ml-9 mt-2 mb-3 leading-relaxed">
                  {q.helper}
                </p>
              )}
              <div className="ml-0 sm:ml-9">
                <textarea
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  rows={q.rows || 3}
                  maxLength={3000}
                  placeholder="Take your time…"
                />
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
