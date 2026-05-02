const testimonials = [
  {
    quote:
      "I asked them to write something for my grandmother's memorial. I cried for an hour, then I played it for the whole family. It was like she was in the room with us.",
    author: "Maya R.",
    context: "Memorial, age 31",
  },
  {
    quote:
      "Twenty-five years married and I'd run out of ways to say it. They wrote a song from one paragraph I sent them. My husband listened to it three times in a row.",
    author: "Anonymous",
    context: "Anniversary, $129 tier",
  },
  {
    quote:
      "I sent them three paragraphs about my best friend of twenty years. They sent back a song that made her sob at her birthday dinner. The whole table did.",
    author: "Jordan T.",
    context: "Friendship, $129 tier",
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 sm:mb-14">
          <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
            Why people come back
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-cream-100">
            What people <span className="font-display-italic text-gold-shine">say after they hear it.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((t, i) => (
            <figure
              key={i}
              className="card-deep rounded-2xl p-6 sm:p-7 flex flex-col"
            >
              <svg
                className="w-8 h-8 text-gold-400/40 mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3 17l3-7H3V3h7v7l-3 7zm11 0l3-7h-3V3h7v7l-3 7z" />
              </svg>
              <blockquote className="font-display-italic text-lg text-cream-100/90 leading-relaxed mb-6 flex-1">
                "{t.quote}"
              </blockquote>
              <figcaption className="text-sm">
                <div className="text-cream-200">— {t.author}</div>
                <div className="text-cream-200/40 text-xs mt-0.5">{t.context}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
