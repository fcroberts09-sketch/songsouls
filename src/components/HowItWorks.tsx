const steps = [
  {
    n: "01",
    title: "Tell us who, and why",
    body: "Pick a genre — memorial, anniversary, healing, just-because. We'll ask the right questions for what you're trying to honor. Upload a photo if you have one.",
  },
  {
    n: "02",
    title: "Pick your tier and pay",
    body: "$99 Standard — one song, MP3, lyrics on your song page, delivered in 7 days. $179 Keepsake — two variations, designed lyrics PDF, extended length, 48-hour rush.",
  },
  {
    n: "03",
    title: "We write your song",
    body: "A songwriter writes the lyrics from your intake — every line, every detail. We then produce the audio with AI-assisted vocals and instrumentation.",
  },
  {
    n: "04",
    title: "Delivered to your inbox",
    body: "MP3 + lyrics + a quiet note from us. One free revision if something needs to land differently. Then play it for the person it's for.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
            How it works
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-cream-100">
            Four steps,{" "}
            <span className="font-display-italic text-gold-shine">one song that lasts.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div
              key={step.n}
              className="card-deep card-deep-hover rounded-2xl p-7 relative overflow-hidden"
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
