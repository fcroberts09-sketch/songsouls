"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getGenre, type GenreId } from "@/lib/genres";
import { getTier, type TierId } from "@/lib/pricing";
import type { GeneratedLyrics, UploadedPhoto } from "@/types/order";
import StepGenre from "./steps/StepGenre";
import StepRecipient from "./steps/StepRecipient";
import StepPhotos from "./steps/StepPhotos";
import StepQuestions from "./steps/StepQuestions";
import StepPreview from "./steps/StepPreview";
import StepCheckout from "./steps/StepCheckout";
import StepSuccess from "./steps/StepSuccess";

type StepKey =
  | "genre"
  | "recipient"
  | "photos"
  | "questions"
  | "preview"
  | "checkout"
  | "success";

const STEP_ORDER: StepKey[] = [
  "genre",
  "recipient",
  "photos",
  "questions",
  "preview",
  "checkout",
];

interface VerifiedSuccess {
  orderId: string;
  customerEmail: string;
  recipientName: string;
  tierName: string;
  turnaround: string;
  amountCents: number;
  paid: boolean;
}

export default function CreateWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTier = (searchParams.get("tier") as TierId) || "ai-crafted";

  // Form state
  const [step, setStep] = useState<StepKey>("genre");
  const [genreId, setGenreId] = useState<GenreId | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientRelationship, setRecipientRelationship] = useState("");
  const [occasion, setOccasion] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Lyrics state
  const [lyrics, setLyrics] = useState<GeneratedLyrics | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);

  // Checkout state
  const [selectedTier, setSelectedTier] = useState<TierId>(
    initialTier && getTier(initialTier) && initialTier !== "preview"
      ? initialTier
      : "ai-crafted"
  );
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Success-state holds details verified server-side after Stripe redirects,
  // OR populated locally for the save-draft path.
  const [successInfo, setSuccessInfo] = useState<VerifiedSuccess | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Banner if Stripe redirected back via cancel_url.
  const canceled = searchParams.get("canceled") === "1";

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
        const requiredQs = genre.questions.filter((q) => q.required);
        return requiredQs.every((q) => (answers[q.id] || "").trim().length > 0);
      }
      case "preview":
        return Boolean(lyrics);
      case "checkout":
        return Boolean(customerName.trim() && customerEmail.trim().includes("@"));
      default:
        return false;
    }
  }, [
    step,
    genreId,
    recipientName,
    recipientRelationship,
    genre,
    answers,
    lyrics,
    customerName,
    customerEmail,
  ]);

  const goToStep = useCallback((next: StepKey) => {
    setStep(next);
  }, []);

  // Scroll to top whenever the step changes. Instant scroll is more reliable
  // than smooth on iOS Safari right after a re-render.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const id = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [step]);

  const generateLyrics = useCallback(async () => {
    if (!genre) return;
    setLyricsLoading(true);
    setLyricsError(null);
    setLyrics(null);
    try {
      const res = await fetch("/api/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genreId: genre.id,
          recipientName,
          recipientRelationship,
          occasion,
          answers: genre.questions.map((q) => ({
            question: q.prompt,
            answer: answers[q.id] || "",
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Couldn't reach the songwriter.");
      }
      setLyrics(data.data);
    } catch (err) {
      setLyricsError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLyricsLoading(false);
    }
  }, [genre, recipientName, recipientRelationship, occasion, answers]);

  // Auto-generate when entering preview step (if not already generated)
  useEffect(() => {
    if (step === "preview" && !lyrics && !lyricsLoading && !lyricsError) {
      void generateLyrics();
    }
  }, [step, lyrics, lyricsLoading, lyricsError, generateLyrics]);

  const buildOrderPayload = useCallback(() => {
    if (!genre) return null;
    return {
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
      draftLyrics: lyrics,
    };
  }, [
    genre,
    customerEmail,
    customerName,
    recipientName,
    recipientRelationship,
    occasion,
    deliveryDate,
    customerNote,
    answers,
    photos,
    lyrics,
  ]);

  const submitOrder = useCallback(
    async (mode: "checkout" | "save-draft") => {
      if (!genre) return;
      setSubmitting(true);
      setSubmitError(null);

      try {
        const payload = buildOrderPayload();
        if (!payload) throw new Error("Missing details — please retry.");

        if (mode === "save-draft") {
          // Free preview path. Save a draft, fire the draft email, show success
          // with the no-payment messaging.
          const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "save-draft", ...payload }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || "Couldn't save your draft.");
          }
          setSuccessInfo({
            orderId: data.orderId,
            customerEmail,
            recipientName: recipientName || "your person",
            tierName: "Lyric Preview",
            turnaround: "Instant",
            amountCents: 0,
            paid: false,
          });
          setStep("success");
          return;
        }

        // Paid path: server creates the order + Stripe session in one call.
        // We then redirect into Stripe's hosted checkout. The order does NOT
        // get marked paid (and emails do NOT fire) until Stripe confirms.
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tierId: selectedTier, ...payload }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Couldn't start checkout.");
        }
        if (!data.url) {
          throw new Error("Stripe didn't return a checkout URL.");
        }
        window.location.href = data.url;
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setSubmitting(false);
      }
    },
    [
      genre,
      buildOrderPayload,
      selectedTier,
      customerEmail,
      recipientName,
    ]
  );

  // Stripe redirected back to /create?step=success&session_id=...
  // We MUST verify with our server before showing the success UI — otherwise
  // anyone could navigate here directly and see a fake confirmation.
  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (stepParam !== "success") return;

    const sessionId = searchParams.get("session_id");

    // Direct nav with no Stripe session id and no in-memory success info →
    // bounce back to the start so we never render an unverified confirmation.
    if (!sessionId) {
      if (!successInfo) {
        router.replace("/create");
      }
      return;
    }

    // We have a session id — verify it with our server.
    setVerifying(true);
    setVerifyError(null);

    fetch(
      `/api/orders/verify?session_id=${encodeURIComponent(sessionId)}`
    )
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok || !data?.success || !data.order) {
          const reason =
            (data && data.error) ||
            "We couldn't confirm your payment. Please try again.";
          throw new Error(reason);
        }
        setSuccessInfo({
          orderId: data.order.id,
          customerEmail: data.order.customerEmail,
          recipientName: data.order.recipientName,
          tierName: data.order.tierName,
          turnaround: data.order.turnaround,
          amountCents: data.order.amountCents,
          paid: true,
        });
        setStep("success");
      })
      .catch((err) => {
        setVerifyError(
          err instanceof Error ? err.message : "Verification failed."
        );
      })
      .finally(() => {
        setVerifying(false);
      });
    // We intentionally only want this to run on mount / when the search params
    // change — successInfo is checked but should not re-trigger verification.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ----- Render -----------------------------------------------------------
  const stepIndex = STEP_ORDER.indexOf(step);
  const totalSteps = STEP_ORDER.length;

  // Verifying-payment splash. No content from prior session — we don't want
  // to flash a fake success while the network call is in flight.
  if (verifying) {
    return (
      <div className="min-h-screen pt-24 sm:pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-12 h-12 mx-auto mb-6 rounded-full border-2 border-gold-400/40 border-t-gold-400 animate-spin" />
          <h2 className="font-display text-2xl text-cream-100 mb-2">
            Confirming your payment…
          </h2>
          <p className="text-cream-200/60 text-sm">
            One moment while we check with Stripe.
          </p>
        </div>
      </div>
    );
  }

  if (verifyError) {
    return (
      <div className="min-h-screen pt-24 sm:pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-md mx-auto text-center py-16 card-deep rounded-2xl p-8">
          <h2 className="font-display text-2xl text-cream-100 mb-3">
            We couldn't confirm your payment
          </h2>
          <p className="text-cream-200/70 text-sm mb-6">{verifyError}</p>
          <p className="text-cream-200/60 text-xs mb-6">
            If you were charged, email us at{" "}
            <a className="text-gold-300" href="mailto:hello@songsouls.ai">
              hello@songsouls.ai
            </a>{" "}
            with the email you used and we'll sort it out.
          </p>
          <button
            onClick={() => router.replace("/create?step=checkout")}
            className="btn-primary"
          >
            Back to checkout
          </button>
        </div>
      </div>
    );
  }

  if (step === "success" && successInfo) {
    return (
      <div className="min-h-screen pt-24 sm:pt-32 pb-20 px-4 sm:px-6">
        <StepSuccess
          orderId={successInfo.orderId}
          customerEmail={successInfo.customerEmail}
          recipientName={successInfo.recipientName}
          tierName={successInfo.tierName}
          turnaround={successInfo.turnaround}
          paid={successInfo.paid}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-20 px-4 sm:px-6">
      {/* Progress bar */}
      <div className="max-w-3xl mx-auto mb-8 sm:mb-10">
        <div className="flex items-center gap-1.5 sm:gap-2">
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
          <span>
            Step {stepIndex + 1} of {totalSteps}
          </span>
          {genre && step !== "genre" && (
            <span className="text-gold-300/80 truncate ml-2 max-w-[55%] text-right">
              {genre.name}
            </span>
          )}
        </div>
      </div>

      {canceled && (
        <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 text-sm text-amber-200 text-center">
          Your checkout was canceled. No charge was made — you can pick up where
          you left off below.
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {step === "genre" && <StepGenre value={genreId} onSelect={setGenreId} />}

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

        {step === "preview" && (
          <StepPreview
            loading={lyricsLoading}
            error={lyricsError}
            lyrics={lyrics}
            onRegenerate={generateLyrics}
          />
        )}

        {step === "checkout" && (
          <StepCheckout
            selectedTier={selectedTier}
            setSelectedTier={setSelectedTier}
            customerEmail={customerEmail}
            setCustomerEmail={setCustomerEmail}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerNote={customerNote}
            setCustomerNote={setCustomerNote}
          />
        )}

        {/* Nav buttons — stack on mobile so the primary CTA never gets squeezed */}
        <div className="max-w-3xl mx-auto mt-10 sm:mt-12 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <button
            onClick={() => {
              const prev = STEP_ORDER[stepIndex - 1];
              if (prev) goToStep(prev);
              else router.push("/");
            }}
            className="btn-ghost w-full sm:w-auto"
            disabled={submitting}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            {step === "checkout" && lyrics && (
              <button
                onClick={() => submitOrder("save-draft")}
                disabled={submitting || !customerEmail.includes("@")}
                className="text-sm text-cream-200/70 hover:text-gold-300 px-4 py-3 sm:py-2 transition-colors text-center"
              >
                Just email me the draft (free, no card)
              </button>
            )}

            {step === "checkout" ? (
              <button
                onClick={() => submitOrder("checkout")}
                disabled={submitting || !canAdvance}
                className="btn-primary w-full sm:w-auto text-sm sm:text-base"
              >
                {submitting
                  ? "Redirecting to secure checkout…"
                  : `Pay $${getTier(selectedTier)?.price} · ${getTier(selectedTier)?.name}`}
              </button>
            ) : (
              <button
                onClick={() => {
                  const next = STEP_ORDER[stepIndex + 1];
                  if (next) goToStep(next);
                }}
                disabled={!canAdvance}
                className="btn-primary w-full sm:w-auto"
              >
                {step === "preview" ? "I love it — what's next?" : "Continue"}
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
