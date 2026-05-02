"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getGenre, type GenreId } from "@/lib/genres";
import { getTier, type TierId } from "@/lib/pricing";
import type { UploadedPhoto } from "@/types/order";
import StepGenre from "./steps/StepGenre";
import StepRecipient from "./steps/StepRecipient";
import StepPhotos from "./steps/StepPhotos";
import StepQuestions from "./steps/StepQuestions";
import StepReview from "./steps/StepReview";
import StepSuccess from "./steps/StepSuccess";

type StepKey = "genre" | "recipient" | "photos" | "questions" | "review" | "success";

const STEP_ORDER: StepKey[] = ["genre", "recipient", "photos", "questions", "review"];

export default function CreateWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial tier from query string (e.g. /create?tier=keepsake)
  const initialTier = (searchParams.get("tier") as TierId) || "standard";
  const initialStep = (searchParams.get("step") as StepKey) || "genre";

  // Form state
  const [step, setStep] = useState<StepKey>(initialStep === "success" ? "success" : "genre");
  const [genreId, setGenreId] = useState<GenreId | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientRelationship, setRecipientRelationship] = useState("");
  const [occasion, setOccasion] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Checkout state
  const [selectedTier, setSelectedTier] = useState<TierId>(
    initialTier && getTier(initialTier) ? initialTier : "standard"
  );
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const genre = useMemo(() => (genreId ? getGenre(genreId) : null), [genreId]);

  const setAnswer = useCallback((id: string, value: string) => {
    setAnswers((a) => ({ ...a, [id]: value }));
  }, []);

  // Step navigation guards
  const canAdvance = useMemo(() => {
    switch (step) {
      case "genre":
        return Boolean(genreId);
      case "recipient":
        return Boolean(recipientName.trim() && recipientRelationship.trim());
      case "photos":
        return true; // Optional
      case "questions": {
        if (!genre) return false;
        // Check all required answers are present
        const requiredQs = genre.questions.filter((q) => q.required);
        return requiredQs.every((q) => (answers[q.id] || "").trim().length > 0);
      }
      case "review":
        return Boolean(customerName.trim() && customerEmail.trim().includes("@"));
      default:
        return false;
    }
  }, [step, genreId, recipientName, recipientRelationship, genre, answers, customerName, customerEmail]);

  const goToStep = useCallback((next: StepKey) => {
    setStep(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const submitOrder = useCallback(
    async () => {
      if (!genre) return;
      setSubmitting(true);
      setSubmitError(null);
      try {
        const tierId: TierId = selectedTier;

        // 1. Create the order
        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tierId,
            genreId: genre.id,
            customerEmail,
            customerName,
            recipientName,
            recipientRelationship,
            occasion,
            deliveryDate,
            customerNote,
            answers: genre.questions.map((q) => ({
              questionId: q.id,
              question: q.prompt,
              answer: answers[q.id] || "",
            })),
            photos,
          }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok || !orderData.success) {
          throw new Error(orderData.error || "Couldn't save your order.");
        }
        setOrderId(orderData.orderId);

        // 2. Create Stripe Checkout session and redirect.
        const checkoutRes = await fetch("/api/checkout/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderData.orderId,
            tier: tierId,
          }),
        });
        const checkoutData = await checkoutRes.json();
        if (!checkoutRes.ok || !checkoutData.success || !checkoutData.url) {
          throw new Error(checkoutData.error || "Couldn't start checkout.");
        }
        window.location.href = checkoutData.url;
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setSubmitting(false);
      }
    },
    [
      genre,
      selectedTier,
      customerEmail,
      customerName,
      recipientName,
      recipientRelationship,
      occasion,
      deliveryDate,
      customerNote,
      answers,
      photos,
    ]
  );

  // Detect Stripe success redirect
  useEffect(() => {
    if (searchParams.get("step") === "success") {
      const orderParam = searchParams.get("order");
      if (orderParam) setOrderId(orderParam);
      setStep("success");
    }
  }, [searchParams]);

  // Render current step
  const stepIndex = STEP_ORDER.indexOf(step);
  const totalSteps = STEP_ORDER.length;

  if (step === "success") {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6">
        <StepSuccess
          orderId={orderId}
          recipientName={recipientName || "your person"}
          tierName={getTier(selectedTier)?.name || ""}
          turnaround={getTier(selectedTier)?.turnaround || "soon"}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      {/* Progress bar */}
      <div className="max-w-3xl mx-auto mb-10">
        <div className="flex items-center gap-2">
          {STEP_ORDER.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= stepIndex ? "bg-gold-400" : "bg-cream-100/10"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-cream-200/50">
          <span>Step {stepIndex + 1} of {totalSteps}</span>
          {genre && step !== "genre" && (
            <span className="text-gold-300/80">{genre.name}</span>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {step === "genre" && (
          <StepGenre value={genreId} onSelect={setGenreId} />
        )}

        {step === "recipient" && genre && (
          <StepRecipient
            genre={genre}
            recipientName={recipientName}
            setRecipientName={setRecipientName}
            recipientRelationship={recipientRelationship}
            setRecipientRelationship={setRecipientRelationship}
            occasion={occasion}
            setOccasion={setOccasion}
            deliveryDate={deliveryDate}
            setDeliveryDate={setDeliveryDate}
          />
        )}

        {step === "photos" && (
          <StepPhotos photos={photos} setPhotos={setPhotos} />
        )}

        {step === "questions" && genre && (
          <StepQuestions genre={genre} answers={answers} setAnswer={setAnswer} />
        )}

        {step === "review" && genre && (
          <StepReview
            selectedTier={selectedTier}
            setSelectedTier={setSelectedTier}
            customerEmail={customerEmail}
            setCustomerEmail={setCustomerEmail}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerNote={customerNote}
            setCustomerNote={setCustomerNote}
            genre={genre}
            recipientName={recipientName}
            recipientRelationship={recipientRelationship}
            occasion={occasion}
            answers={answers}
          />
        )}

        {/* Nav buttons */}
        <div className="max-w-3xl mx-auto mt-12 flex items-center justify-between gap-4">
          <button
            onClick={() => {
              const prev = STEP_ORDER[stepIndex - 1];
              if (prev) goToStep(prev);
              else router.push("/");
            }}
            className="btn-ghost"
            disabled={submitting}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="flex items-center gap-3">
            {step === "review" ? (
              <button
                onClick={() => submitOrder()}
                disabled={submitting || !canAdvance}
                className="btn-primary"
              >
                {submitting
                  ? "Starting checkout…"
                  : `Pay & Begin · $${getTier(selectedTier)?.price}`}
              </button>
            ) : (
              <button
                onClick={() => {
                  const next = STEP_ORDER[stepIndex + 1];
                  if (next) goToStep(next);
                }}
                disabled={!canAdvance}
                className="btn-primary"
              >
                Continue
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {submitError && (
          <div className="max-w-3xl mx-auto mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-400/30 text-sm text-rose-300 text-center">
            {submitError}
          </div>
        )}
      </div>
    </div>
  );
}
