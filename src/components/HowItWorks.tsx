const steps = [
  {
    n: "01",
    title: "Tell us who, and why",
    body: "Pick a genre — memorial, anniversary, healing, just-because. We'll ask the right questions for what you're trying to honor. Upload a photo if you have one.",
  },
  {
    n: "02",
    title: "See the lyrics, free",
    body: "Our AI drafts the first verse and chorus from your story — instantly, in your voice. No card required. If it doesn't move you, you don't pay.",
  },
  {
    n: "03",
    title: "Pick how finished you want it",
    body: "$39 for an AI-crafted full song with studio audio. $129 for a real songwriter to shape it. $500 for a Life Album — eight songs, one story, one consultation, an arc.",
  },
  {
    n: "04",
    title: "We deliver in 24 hours",
    body: "MP3, lyric sheet, and a quiet note from us — in your inbox. One free revision if it's not quite right. Then play it for the person it's for.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
            How it works
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-cream-100">
            Four steps,{" "}
            <span className="font-display-italic text-gold-shine">one song that lasts.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {steps.map((step, i) => (
            <div
              key={step.n}
              className="card-deep card-deep-hover rounded-2xl p-6 sm:p-7 relative overflow-hidden"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="font-display text-5xl text-gold-400/20 mb-4">{step.n}</div>
              <h3 className="font-display text-xl text-cream-100 mb-3">{step.title}</h3>
              <p className="text-sm text-cream-200/60 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
