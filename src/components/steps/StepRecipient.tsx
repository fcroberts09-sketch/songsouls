"use client";

import type { Genre } from "@/lib/genres";

interface StepRecipientProps {
  genre: Genre;
  recipientName: string;
  setRecipientName: (v: string) => void;
  recipientRelationship: string;
  setRecipientRelationship: (v: string) => void;
  occasion: string;
  setOccasion: (v: string) => void;
  deliveryDate: string;
  setDeliveryDate: (v: string) => void;
}

export default function StepRecipient(props: StepRecipientProps) {
  const {
    genre,
    recipientName,
    setRecipientName,
    recipientRelationship,
    setRecipientRelationship,
    occasion,
    setOccasion,
    deliveryDate,
    setDeliveryDate,
  } = props;

  return (
    <div>
      <header className="mb-8 text-center">
        <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
          Step 2 of 5
        </div>
        <h2 className="font-display text-3xl md:text-5xl text-cream-100 mb-3">
          Who is this for?
        </h2>
        <p className="text-cream-200/60 max-w-lg mx-auto">{genre.description}</p>
      </header>

      <div className="max-w-xl mx-auto space-y-5">
        <Field label="Their name" required>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder={
              genre.id === "memorial"
                ? "Rose"
                : genre.id === "healing"
                  ? "The 7-year-old me"
                  : "Sam"
            }
            maxLength={80}
          />
        </Field>

        <Field
          label="Who they are to you"
          helper="Daughter, partner, my best friend of 20 years…"
          required
        >
          <input
            type="text"
            value={recipientRelationship}
            onChange={(e) => setRecipientRelationship(e.target.value)}
            placeholder="Grandmother"
            maxLength={80}
          />
        </Field>

        <Field
          label="Occasion (optional)"
          helper="A birthday, a wedding, a quiet Tuesday."
        >
          <input
            type="text"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            placeholder="Her 80th birthday"
            maxLength={200}
          />
        </Field>

        <Field
          label="When do you need it? (optional)"
          helper="We'll do our best to deliver in 24 hours, but tell us if there's a date that matters."
        >
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  helper,
  required,
  children,
}: {
  label: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm font-medium text-cream-100">
            {label}
            {required && <span className="text-gold-400 ml-1">*</span>}
          </span>
        </div>
        {children}
        {helper && (
          <p className="mt-1.5 text-xs text-cream-200/45 leading-relaxed">{helper}</p>
        )}
      </label>
    </div>
  );
}
