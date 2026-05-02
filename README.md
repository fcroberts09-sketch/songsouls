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

The app boots without any API keys, but **paid checkout requires Stripe** — without `STRIPE_SECRET_KEY` the "Pay $39" button returns a 503 (we never accept a paid order without taking payment). The free draft path still works:

- **No `ANTHROPIC_API_KEY`** → Lyric preview shows a placeholder draft.
- **No `STRIPE_SECRET_KEY`** → Paid checkout is disabled. Free draft still works.
- **No `RESEND_API_KEY`** → Emails are logged to the console instead of delivered.
- **No `FIREBASE_*`** → Orders fall back to `./data/orders.json` (single-instance only).

## Order flow (high level)

```
Wizard → POST /api/checkout (creates pending order in Firestore + Stripe Checkout Session)
       → Stripe hosted checkout (user pays)
       → Stripe redirects to /create?step=success&session_id=cs_…
            → client GET /api/orders/verify (confirms payment, atomically promotes order, sends emails)
       → Stripe webhook POST /api/webhooks/stripe   (idempotent — promotes + emails if verify hasn't yet)
```

The "Just email me the draft (free, no card)" path skips Stripe entirely — it goes straight to `POST /api/orders` (save-draft mode) and fires a clearly-marked draft email.

## Production setup

Get these going in order:

1. **Anthropic** — sign up at [console.anthropic.com](https://console.anthropic.com), set `ANTHROPIC_API_KEY`. Lyric previews then generate real drafts in ~10 seconds.
2. **Stripe** — at [dashboard.stripe.com](https://dashboard.stripe.com):
   - Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
   - Create a webhook endpoint at `${NEXT_PUBLIC_SITE_URL}/api/webhooks/stripe` listening for `checkout.session.completed`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
   - Optionally pre-create Stripe products and set `STRIPE_PRICE_AI_CRAFTED`, `STRIPE_PRICE_CURATED`, `STRIPE_PRICE_LIFE_ALBUM`.
3. **Resend** — verify your sending domain at [resend.com](https://resend.com), set `RESEND_API_KEY`, `OWNER_EMAIL` (where new-order alerts go), and `ORDER_FROM_EMAIL` (the from-address on the customer email).
4. **Firebase** (optional but recommended for production) — create a Firestore database + service account at [console.firebase.google.com](https://console.firebase.google.com). Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. Without these, orders go to `./data/orders.json`, which works for a single instance but breaks on Vercel's serverless filesystem.
5. **Admin password** — set `ADMIN_PASSWORD` to a long random string. Visit `/admin?pw=YOUR_PASSWORD` to view orders.

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
│   │       ├── lyrics/route.ts                # Claude API → live lyric preview
│   │       ├── orders/route.ts                # Save-draft (free, no payment)
│   │       ├── orders/verify/route.ts         # Confirm Stripe session + promote order
│   │       ├── checkout/route.ts              # Create order + Stripe checkout session
│   │       └── webhooks/stripe/route.ts       # Stripe webhook (checkout.session.completed)
│   ├── components/                  # All React components
│   ├── lib/
│   │   ├── brand.ts                 # Name, tagline, voice — single source
│   │   ├── genres.ts                # All 8 genres + dynamic intake questions
│   │   ├── pricing.ts               # All 4 tiers (Preview / AI / Curated / Life Album)
│   │   ├── songs.ts                 # YOUR SHOWCASE LIBRARY — edit this file
│   │   ├── prompts.ts               # Claude system prompt for lyric generation
│   │   ├── orders.ts                # Order persistence (Firestore + file fallback)
│   │   ├── firebase.ts              # Firebase Admin lazy init
│   │   ├── email.ts                 # Resend integration (paid + draft variants)
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
- **Customer order status page** — let customers check on their order via emailed link
- **Firebase Storage for photos** — currently photos are stored as base64 in a Firestore sub-collection. Moving to Storage gets us better long-term costs and lets us serve them via signed URLs.
- **Practitioner portal** — separate intake + bulk billing for therapists

## License

Proprietary. All rights reserved.
