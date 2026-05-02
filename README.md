# SongSouls

> The people you love, set to music.

Personalized songs written from your story. Built with Next.js 14, TypeScript, Tailwind, Claude (lyrics), Stripe (payments), and Resend (email). Designed to ship fast and feel premium.

## Quick start

```bash
# 1. Install
npm install

# 2. Copy env file and add real keys (none are strictly required to start)
cp .env.example .env.local

# 3. Run dev server
npm run dev

# 4. Open
open http://localhost:3000
```

That's it. The app works without any API keys configured — every integration degrades gracefully:

- **No `ANTHROPIC_API_KEY`** → Lyric preview shows a placeholder draft so you can demo the flow.
- **No `STRIPE_SECRET_KEY`** → Checkout submits as a lead and saves to `./data/orders.json`.
- **No `RESEND_API_KEY`** → Order notifications are logged to the console instead of emailed.

So you can demo the whole product end-to-end before wiring up a single key.

## Production setup

Get all four going in this order:

1. **Anthropic** — sign up at [console.anthropic.com](https://console.anthropic.com), grab a key, set `ANTHROPIC_API_KEY`. Lyric previews now generate real drafts in ~10 seconds.
2. **Stripe** — create products in your [Stripe dashboard](https://dashboard.stripe.com) for each tier. Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Optionally set `STRIPE_PRICE_AI_CRAFTED`, `STRIPE_PRICE_CURATED`, and `STRIPE_PRICE_LIFE_ALBUM` to use predefined Stripe price IDs.
3. **Resend** — set up your sending domain at [resend.com](https://resend.com), verify it, set `RESEND_API_KEY`, `ORDER_NOTIFICATION_EMAIL` (where you receive new-order alerts), and `ORDER_FROM_EMAIL` (which appears on the customer-facing receipt).
4. **Admin password** — set `ADMIN_PASSWORD` to a long random string. Visit `/admin?pw=YOUR_PASSWORD` to view orders.

## Project structure

```
songsouls/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing page
│   │   ├── create/page.tsx          # Multi-step wizard
│   │   ├── songs/page.tsx           # Song library showcase
│   │   ├── songs/[slug]/page.tsx    # Individual song page
│   │   ├── manifesto/page.tsx       # Brand manifesto
│   │   ├── about/page.tsx           # For therapists / practitioners
│   │   ├── admin/page.tsx           # Order dashboard
│   │   └── api/
│   │       ├── lyrics/route.ts      # Claude API → live lyric preview
│   │       ├── orders/route.ts      # Submit order + email notification
│   │       └── checkout/route.ts    # Stripe checkout session
│   ├── components/                  # All React components
│   ├── lib/
│   │   ├── brand.ts                 # Name, tagline, voice — single source
│   │   ├── genres.ts                # All 8 genres + dynamic intake questions
│   │   ├── pricing.ts               # All 4 tiers (Preview / AI / Curated / Life Album)
│   │   ├── songs.ts                 # YOUR SHOWCASE LIBRARY — edit this file
│   │   ├── prompts.ts               # Claude system prompt for lyric generation
│   │   ├── orders.ts                # File-based order persistence
│   │   ├── email.ts                 # Resend integration
│   │   ├── rate-limit.ts            # In-memory IP rate limiter
│   │   └── validation.ts            # Input + AI output sanitization
│   └── types/
│       ├── order.ts
│       └── song.ts
└── public/
    ├── songs/                       # Drop your MP3s here
    └── images/                      # Drop song cover art here
```

## Adding your own songs to the showcase

1. Drop the MP3 in `public/songs/your-song.mp3`
2. (Optional) Drop the cover image in `public/images/your-song.jpg` (square, ~1200×1200)
3. Add an entry to `src/lib/songs.ts`:

```ts
{
  slug: "your-song-slug",
  title: "Your Song Title",
  dedication: "For [recipient]",
  genre: "In Memory",
  duration: "3:42",
  tier: "curated",
  addedAt: "2026-05-01",
  audioUrl: "/songs/your-song.mp3",
  coverImage: "/images/your-song.jpg",
  story: "Why you wrote it...",
  lyrics: `Lyrics with line breaks...`,
}
```

The song will automatically show up on the home page showcase + the `/songs` library + at `/songs/your-song-slug`.

## Spawning the roast variant (SongSoulsRoast)

This codebase is built so a roast variant can be cloned by:

1. Forking the repo
2. Editing `src/lib/brand.ts` to use the roast brand name and voice
3. Editing `src/lib/genres.ts` to use roast-appropriate genres + intake questions
4. Editing `src/lib/prompts.ts` to use a different system prompt
5. Tweaking the color palette in `tailwind.config.ts`

Same Stripe, same Anthropic, same Resend — different soul.

## Deploying to Vercel

```bash
npm install -g vercel
vercel
```

In the Vercel dashboard, set all the env vars from `.env.example`. The `vercel.json` already configures the appropriate function timeouts for the Anthropic and Stripe routes.

## Security

- API keys are server-side only (never exposed to the client)
- Rate limits on every API route (5–10 req/min per IP)
- Strict CSP headers in `next.config.js` (Stripe-aware)
- Input sanitization on every field
- Photo uploads capped at 6MB and 6 photos per order
- Admin route protected by `ADMIN_PASSWORD`

## Roadmap

Things to build next:

- **Suno integration** — automate audio generation for the AI tier (currently manual)
- **Stripe webhook** — auto-update order status on `checkout.session.completed`
- **Customer order status page** — let customers check on their order via emailed link
- **Database** — swap the file-based store (`/data/orders.json`) for Supabase or Postgres
- **Practitioner portal** — separate intake + bulk billing for therapists

## License

Proprietary. All rights reserved.
