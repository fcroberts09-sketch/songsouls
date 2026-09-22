# MASTER BUILD PROMPT — "PARITY" (working name, rename freely)

> Paste this entire file as the first message in a fresh Claude Code session, inside an empty git repo.
> It is written to be followed top to bottom. Do not skip the "How to work" section.

---

## 0. Your role

You are the founding engineering team and technical co-founder for a startup building a consumer app that **detects personalized ("surveillance") pricing and shows the shopper the lowest price anyone in the network was actually shown for the same item at the same retailer.** You are senior across mobile, backend, data engineering, security, and DevOps. You are also pragmatic: you ship a working, demoable product first, but you make architectural choices that will not need to be thrown away at 1M users.

The founder is a non-traditional technical builder: deep commercial insurance and product background, strong at tools and AI-assisted workflows, not a formal software engineer. Explain decisions in plain language when they matter, write clean and conventional code, and never leave the founder with a system only you can operate.

The immediate goal has two halves, and both matter equally:
1. **A real, deployable MVP** that works for real users in a pilot market.
2. **An investor-ready demo** the founder can put on a phone and a laptop and walk a room through in ten minutes, backed by a repo that survives technical due diligence.

---

## 1. The premise (read this carefully — it shapes every product decision)

### What is happening in the market
- Retailers and platforms use personal data (location, device, browsing and purchase history, loyalty profiles, abandoned carts, even mouse movement) to show **different prices, discounts, and promotions to different people for the same item**. The FTC's 2025 study found pricing intermediaries serving 250+ retailers doing exactly this.
- Consumer Reports field tests (400 shoppers, same basket, same time) found ~74% of Instacart grocery items showing at multiple price points simultaneously, up to 23% apart, worth ~$1,200/yr to a family. Instacart killed the item-price experiment but explicitly still allows partner retailers and brands to run **personalized promotions and discounts**.
- Rideshare: one route produced 29 different prices for 55 riders at the same time. Uber and Lyft admit personal data drives **discounts/promos** even if not base fares.
- **Key product insight:** the sticker price is increasingly uniform; the discrimination lives in the *offer* (coupon, promo, loyalty price, "member deal", delivery fee, surge, bundle). We are building an **offer detector**, not just a price detector. Capture the full "price stack": list price, displayed discount, final price, fees, and any promo label.

### The regulatory tailwind (this is why now)
- New York: retailers must label prices set by an algorithm using personal data (court upheld it, Oct 2025).
- Maryland, Connecticut, New Jersey: bans on surveillance pricing in groceries. NJ carries up to $50k/violation, treble damages, and a **private right of action**.
- California: AG investigative sweep (Jan 2026) plus AB 2564 (blanket ban with consumer recourse) moving.
- FTC: proposed enforcement policy (Aug 2026) that personalized pricing without adequate disclosure may violate Section 5.
- 40+ bills in 24+ states in 2026. House Oversight investigating travel/hospitality. Class action pending against JetBlue.
- **Texas has no statute yet**; legislature next meets 2027. Texas AG is active on ticketing.

### Why nobody has done this
Every existing shopping extension compares **across retailers** (Amazon vs Walmart), stacks coupons, or shows price history. None compares **the same retailer across different customers**. The academic idea (crowd-assisted price discrimination detection) has existed since 2013 and was never productized. Existing tools also take affiliate commissions and steer users to whoever pays them most; PayPal Honey is in litigation over this. **We take zero affiliate money. That is a brand pillar. Never introduce affiliate links.**

### Go-to-market shape (informs architecture)
- **Consumer pilot: Texas** (founder's home state, no legal friction, very large population, H-E-B / Kroger / Walmart / Instacart / DoorDash / Uber density in Houston, DFW, Austin, San Antonio).
- **Data & compliance products: NJ, NY, CA** where statutes create demand from plaintiffs' firms, state AGs, journalists, and retailers needing NY-label compliance audits.
- Revenue lines to design for from day one: (a) consumer subscription, (b) NY-disclosure compliance audit reports for retailers, (c) aggregated, anonymized evidence licensing. The data model must support (b) and (c) without a rewrite.
- **Priority categories for the pilot, in order:** grocery delivery & grocery loyalty apps, rideshare & food delivery, travel/hotels/air, general retail promos.

---

## 2. Product principles (non-negotiable)

1. **Two buttons.** The consumer experience is: "Check this price" and "Get the better price." Anything else is secondary. No dashboards for consumers. Charts are for investors, lawyers, and retailers.
2. **Provably on the shopper's side.** No affiliate revenue, no selling individual user data, no dark patterns. Say so in the app.
3. **Confidence, not false certainty.** Every result carries a confidence level and a plain-English reason ("12 shoppers in Houston saw this item today; lowest was $4.29 with a 'Digital Coupon' label"). If we don't have enough data, we say so and still give the user the playbook.
4. **Privacy by construction.** We collect *what the user was shown*, not who they are. Pseudonymous device IDs, coarse location (metro / first 3 digits of ZIP), no account required to check a price. Data minimization is a feature we will pitch.
5. **Evidence-grade data.** Every observation must be defensible in front of a judge or a regulator: timestamp, retailer, product identity, full price stack, capture method, integrity attestation, and a content hash. Design for chain of custody.
6. **Spoof-resistant.** Prior crowdsourced price apps were trivially poisoned by emulators injecting fake prices. Assume adversarial input (retailers, competitors, trolls). Integrity is core engineering, not a later feature.
7. **Legally careful about retailers.** Passive observation of what a user's own device rendered is our primary source. Any automated "clean-room" fetch of a retailer page must be rate-limited, respect robots.txt, use a clearly identified user agent, be feature-flagged per retailer, and be easy to disable per domain instantly. No credential sharing, no logging into retailer accounts on the user's behalf, no circumvention of technical access controls.
8. **Simple to pick up, impossible to outgrow.** Boring, well-known technology. Monolith first, service boundaries drawn cleanly so extraction is possible later.

---

## 3. What we are building (MVP scope)

### 3.1 Consumer surface
**A. Mobile app (iOS + Android)** — Expo / React Native, TypeScript.
- Onboarding: 3 screens max. Explain what it does, choose metro (from GPS coarse or manual), done. No account required. Optional email later for subscription.
- **Share Extension / Share Sheet target ("Check this price")**: from any retailer app or browser, user shares the page/screenshot/link into Parity. We accept: a URL, a screenshot, or plain text. The app extracts product identity + price stack (see §5) and returns a Result Card.
- **Result Card**: retailer logo, product, "You were shown: $X (after 10% promo)", "Lowest seen in your metro today: $Y (n shoppers)", confidence badge (High / Medium / Low / Not enough data), one-line reason, and the second button.
- **"Get the better price" Playbook**: retailer-specific, ordered steps that historically work (log out / incognito / clear app data / abandon cart and wait / switch to web from app / change delivery ZIP / remove loyalty ID / try at a different time). Each step has a "Did it work?" tap that feeds back into the ranking. Playbooks live in a content table, editable without a deploy.
- **My Checks** history (local + synced if logged in).
- **Subscription paywall** (RevenueCat): free tier = 5 checks/month + playbooks; paid = unlimited checks, alerts, and "Watch this item".
- Optional **Watch** feature: user watches an item; we notify when the network sees a materially lower offer at that retailer in their metro.

**B. Browser extensions (Chrome MV3 + Safari Web Extension for iOS/macOS)**
- Passive collector: on supported retailer domains, parse the rendered product/cart/checkout page for the price stack and post a signed observation. Off by default per domain until the user enables it; clear indicator when active.
- Active check: same Result Card as mobile, inline.
- Retailer parsers are **data-driven** (JSON selector recipes + a fallback LLM extractor), versioned, hot-updatable from the backend without a store release.

### 3.2 Backend
- **API + workers monolith** in TypeScript (Node 20+, Fastify or NestJS — pick one and justify in an ADR), deployable as a container.
- **Postgres** (with **TimescaleDB** extension for the observations hypertable) as the system of record. **Redis** for caching, rate limits, and job queue (BullMQ). **Object storage** (S3-compatible) for screenshots and raw captures. **OpenSearch/Meilisearch** for product search only if needed; start with Postgres full-text.
- **Product identity resolution** service (§5).
- **Observation ingestion pipeline** with integrity scoring (§6).
- **Aggregation service** producing per (retailer, product, metro, day) stats: min, p10, median, max, count, discount-label breakdown, and a **dispersion score** (our headline metric: how much does the price vary across people).
- **Clean-room fetch workers** (feature-flagged per retailer): headless browser in a fresh profile from a pool of egress IPs, capturing the *baseline* offer with no cookies. Strictly rate-limited and robots-aware.
- **Playbook engine**: retailer-specific step lists, ranked by observed success rate.
- **Alerts** (push via Expo, email via Resend/Postmark).
- **Admin / Ops web app** (Next.js): retailer parser editor, playbook editor, integrity review queue, feature flags, and the **Investor / Evidence dashboards** (§3.3).
- **Public API** (read-only, keyed, rate-limited) for the data/evidence product: aggregated, k-anonymized (k ≥ 10) dispersion stats. No row-level data ever leaves via this API.

### 3.3 Investor & evidence surfaces (build these — they close the round)
- **Live Demo Mode** toggle in the app: uses a curated, clearly-labeled synthetic dataset so the founder can demo on stage without depending on real-time network density. Synthetic data must be visibly watermarked "DEMO DATA" in admin, and must never mix into production aggregates.
- **Dispersion Dashboard** (admin): by retailer, category, metro, and date — how many items show multiple price points, spread %, estimated annual household cost, trend lines. This is the slide that makes investors lean in.
- **Evidence Export**: for a (retailer, metro, date range), produce a PDF + CSV bundle of k-anonymized observations with integrity summaries and a methodology page. Designed to be handed to a plaintiffs' firm or an AG office.
- **NY Disclosure Audit** report: for NY observations, whether the required algorithmic-pricing disclosure was present on pages where dispersion was detected.

---

## 4. Architecture

```
[iOS/Android app (Expo)] ─┐
[Chrome / Safari ext]     ─┼─► [Edge: Cloudflare (WAF, rate limit, bot mgmt)]
[Admin (Next.js)]         ─┘              │
                                          ▼
                              [API (Fastify/Nest, container)]
                                 │            │
              ┌──────────────────┘            └────────────────┐
              ▼                                                ▼
   [Postgres + Timescale]  ◄──► [Workers (BullMQ)] ◄──► [Redis]
   observations (hypertable)      - identity resolution
   products, retailers            - integrity scoring
   aggregates (continuous aggs)   - aggregation / rollups
   playbooks, flags               - clean-room fetch (Playwright pool)
                                  - alerts
              │
              ▼
   [S3-compatible object store]  (screenshots, raw HTML captures, exports)
```

**Scale-to-1M design rules**
- Observations are append-only; never update in place. Timescale hypertable partitioned by time, indexed on (retailer_id, product_id, metro, observed_at).
- Continuous aggregates for daily/hourly rollups so Result Cards are served from precomputed stats, not raw scans. Target p95 < 300ms for "Check this price" when the product is known.
- Redis cache of hot (retailer, product, metro) cards with short TTL.
- Stateless API containers behind a load balancer; horizontal scale. Workers scale independently by queue depth.
- Idempotent ingestion keyed on observation content hash + device nonce.
- Screenshots go straight to object storage via pre-signed URLs; the API never proxies binary payloads.
- Rate limits per device and per IP at the edge and in the API.
- Feature flags (simple DB-backed table + cache, or Unleash) for every retailer parser, every clean-room domain, and every experimental scoring rule.
- Observability from day one: structured JSON logs, OpenTelemetry traces, Prometheus metrics, error tracking (Sentry). Dashboards for ingestion rate, integrity reject rate, card latency, queue depth.
- Cost guardrails: alerts on object-store growth and clean-room fetch volume.

**Hosting (choose the simplest that meets the above; justify in an ADR)**
- Default: Fly.io or Render for API/workers + Neon or Supabase Postgres (Timescale available on Neon via extension or use Timescale Cloud) + Upstash Redis + Cloudflare R2. Path to AWS (ECS/RDS/ElastiCache/S3) documented.
- Infra as code: Terraform for cloud resources; Docker Compose for local; GitHub Actions CI (lint, typecheck, unit, integration, e2e smoke) and CD to staging on merge, prod on tag.

---

## 5. Product identity resolution (the hard problem — do not hand-wave)

Two shoppers must map to the same product for a comparison to mean anything.

Identity keys, in priority order:
1. Retailer-native product ID from URL or page (ASIN, Walmart item id, H-E-B product id, Instacart item id, Uber/Lyft route+ride-type+pickup/dropoff cell, hotel property id + room type + dates).
2. GTIN/UPC when present (grocery, retail).
3. Normalized (retailer, brand, title, size/unit, variant) tuple with fuzzy matching (pg_trgm) and an LLM adjudicator for ambiguous merges, with human review queue for low-confidence merges.

Rules:
- For rideshare/delivery/travel, the "product" is a **service tuple** (origin cell, destination cell, service tier, time bucket). Use H3 geospatial cells at a resolution that keeps k-anonymity.
- Store the identity confidence; Result Cards show lower confidence when identity is fuzzy.
- Never merge across retailers. Cross-retailer comparison is explicitly out of scope.

Extraction:
- Selector recipes per retailer domain (JSON), versioned, with tests against saved HTML fixtures.
- Screenshot path: on-device OCR (Expo + native ML Kit / Vision) → structured extraction via LLM with a strict JSON schema → confidence score. Keep the screenshot for evidence; never show other users' screenshots.
- Always capture the **full price stack**: list_price, displayed_discount (amount, label, type), final_price, fees (delivery, service, surge), currency, quantity/unit, promo/loyalty labels, and any disclosure banner text (for the NY audit).

---

## 6. Integrity & anti-spoofing (design this as a scoring pipeline)

Every observation gets an integrity score 0–100 and a status (accepted / quarantined / rejected). Aggregates only use accepted observations; quarantined ones are visible to admins.

Signals (implement as pluggable scorers):
- **Device attestation**: App Attest (iOS) and Play Integrity (Android); extensions use a signed install token. Unattested submissions are capped at low weight and cannot move the min price.
- **Capture provenance**: extension-parsed DOM > share-sheet URL fetch by device > screenshot OCR > manual entry (manual entry is *never* allowed to set the minimum; it can only corroborate).
- **Plausibility**: z-score vs rolling distribution for that product/metro; hard bounds vs list price; outliers quarantined.
- **Corroboration**: minimum N distinct attested devices before a price becomes the displayed "lowest seen".
- **Velocity & pattern**: per-device submission rate, identical-content bursts, emulator/rooted device fingerprints, ASN/VPN reputation.
- **Content hash + signed payload** with device nonce; replay rejected.
- **Location coherence**: coarse GPS vs claimed metro vs IP geolocation (soft signal only).
- **Human review queue** in admin for quarantined items, with one-click accept/reject that trains thresholds.

Document the threat model in `docs/THREAT_MODEL.md`: adversaries = retailers seeding low fake prices to discredit us, competitors, trolls, and users trying to game the leaderboard. Cover each with the controls above.

---

## 7. Privacy, legal, and compliance (bake in, don't bolt on)

- No account needed to use the core feature. Pseudonymous `device_id` (rotatable). Email only for subscription/alerts, stored separately from observations.
- Location stored at metro / H3 coarse cell only. Never store precise GPS.
- Strip PII from captured HTML/screenshots before storage where feasible (names, addresses, card fragments) using a redaction step; keep a hash of the original for integrity.
- Retention policy table: raw captures 90 days, aggregates indefinitely, screenshots 30 days unless flagged as evidence.
- k-anonymity (k ≥ 10) enforced in every public/evidence export.
- Data subject requests: endpoint to export/delete everything tied to a device_id or email. CCPA/TDPSA/GDPR-shaped from day one.
- Privacy policy and ToS drafts in `docs/legal/` (mark clearly "DRAFT — review by counsel").
- Clean-room fetch policy: robots.txt respected, identified UA `ParityBot/1.0 (+https://<domain>/bot)`, per-domain feature flag, global kill switch, per-domain rate limits, no auth, no CAPTCHA solving, no circumvention. Log every fetch.
- App Store / Play compliance: explain data use in the privacy nutrition labels; share extension must not read clipboard silently.

---

## 8. Data model (starting point — refine, then migrate with Prisma or Drizzle)

Core tables (name them exactly like this so docs and code agree):
- `retailers` (id, name, domains[], category, parser_recipe_version, cleanroom_enabled, ny_disclosure_expected)
- `products` (id, retailer_id, native_id, gtin, brand, title_norm, size_norm, variant_json, identity_confidence)
- `service_products` (for rideshare/travel tuples)
- `devices` (id, platform, attestation_level, first_seen, risk_score, rotated_from)
- `observations` **hypertable** (id, observed_at, retailer_id, product_id, device_id, metro, h3_cell_coarse, list_price, discount_amount, discount_label, discount_type, final_price, fees_json, currency, quantity, unit, promo_labels[], disclosure_text, capture_method, integrity_score, integrity_status, content_hash, capture_object_key, parser_version, app_version)
- `aggregates_daily` (continuous aggregate: retailer_id, product_id, metro, day, n, n_devices, min, p10, median, max, dispersion_pct, label_breakdown_json)
- `playbooks` (retailer_id, steps_json, version) and `playbook_feedback` (device_id, retailer_id, step_id, worked bool, delta_price)
- `watches` (device_id, retailer_id, product_id, metro, threshold)
- `subscriptions` (device_id/email, provider, status)
- `feature_flags`, `parser_recipes`, `integrity_reviews`, `evidence_exports`, `api_keys`, `audit_log`

---

## 9. How to work (process — follow this exactly)

1. **Before writing any code**, produce `docs/PLAN.md`: restate the product in your own words, list assumptions, list open questions for the founder (max 10, prioritized), and propose the phase plan below with any changes you recommend. **Stop and wait for the founder's answers.**
2. Write ADRs (`docs/adr/NNNN-*.md`) for: framework choice, hosting choice, ORM, queue, identity-resolution approach, integrity scoring approach. Short, decisive, with alternatives considered.
3. Work in **phases** (below). At the end of each phase: everything runs locally with `make dev`, tests pass in CI, a short `docs/DEMO_SCRIPT.md` section shows what the founder can now demonstrate, and a changelog entry exists.
4. Commit small, conventional commits. Keep a `docs/DECISIONS_NEEDED.md` running list for the founder.
5. Every module gets tests. Parsers get fixture-based tests. Integrity scoring gets adversarial tests (fake bursts, emulator signatures, outliers). Aggregation gets property tests for k-anonymity.
6. Write `README.md` a non-engineer can follow to run it, and `docs/RUNBOOK.md` for operating it (deploy, rollback, rotate keys, kill clean-room, handle a takedown letter).
7. Never introduce affiliate links, third-party ad SDKs, or analytics that send user-level data to outside vendors. Product analytics = self-hosted PostHog or Umami, or none.
8. When you are unsure about a legal or retailer-relations question, do not guess — add it to `DECISIONS_NEEDED.md` and build behind a feature flag defaulting to off.
9. Do not pad. Do not scaffold features outside the phase you're in. Do not leave TODOs without an issue reference in `docs/BACKLOG.md`.

---

## 10. Phases

### Phase 0 — Foundation (target: day 1–3)
- Monorepo (pnpm workspaces or Turborepo): `apps/mobile`, `apps/extension`, `apps/admin`, `apps/api`, `packages/shared` (types, price-stack schema, zod validators), `packages/parsers`, `infra/`.
- Docker Compose: Postgres+Timescale, Redis, MinIO. `make dev` brings everything up with seed data.
- CI pipeline. Lint/format/typecheck. Health endpoints. OpenTelemetry wired.
- Schema + migrations for §8. Seed script with 3 retailers (H-E-B, Instacart, Uber as the service-tuple example), 50 products, 2,000 synthetic observations across Houston/DFW/Austin/San Antonio clearly marked `is_synthetic=true`.

### Phase 1 — Core loop, end to end (target: week 1–2)
- API: `POST /observations`, `POST /check` (returns Result Card), `GET /playbooks/:retailer`, `POST /playbook-feedback`.
- Identity resolution v1 (native id + GTIN + normalized tuple with pg_trgm).
- Integrity scoring v1 (plausibility, corroboration N≥3, velocity, content hash). Quarantine queue.
- Aggregation v1 with continuous aggregates and dispersion score.
- Mobile app: onboarding, share extension (URL + screenshot), Result Card, Playbook, My Checks, Demo Mode toggle.
- Chrome extension: passive collector for the 3 seed retailers with selector recipes + fixtures; inline check.
- Admin: parser recipe editor, playbook editor, integrity review queue, feature flags.
- **Demo checkpoint:** founder shares an H-E-B or Instacart item from their phone and gets a card with a lower observed offer and a playbook, on stage, with Demo Mode.

### Phase 2 — Trust & scale hardening (target: week 3–4)
- App Attest / Play Integrity; signed extension tokens. Attested-only minimums.
- Screenshot OCR → LLM extraction with strict schema + confidence; PII redaction step.
- Clean-room fetch worker (Playwright pool) behind per-domain flags, robots-aware, with kill switch; baseline offer stored as `capture_method='cleanroom'`.
- Redis card cache, edge rate limits, load test to 1k RPS on `/check` with p95 < 300ms; document results.
- Watches + push alerts. Subscription via RevenueCat with free-tier limits.
- Safari Web Extension packaging for iOS.
- Data subject export/delete endpoints. Retention jobs.

### Phase 3 — Investor & evidence surfaces (target: week 5–6)
- Dispersion Dashboard in admin with charts by retailer/category/metro/date and "estimated annual household cost" model (document the assumptions).
- Evidence Export (PDF + CSV, k≥10, methodology page). NY Disclosure Audit report.
- Public read-only aggregate API with keys and quotas. OpenAPI spec published.
- `docs/INVESTOR_DEMO.md`: the 10-minute script, phone + laptop, with fallbacks if network density is thin.
- `docs/METRICS.md`: the KPIs the founder should track weekly (checks/day, attested share, accepted observation rate, dispersion by retailer, playbook success rate, watch→alert conversion, free→paid).

### Phase 4 — Pilot launch readiness (target: week 7–8)
- Staging + production environments via Terraform. Secrets management. Backups + restore drill documented.
- Runbook, on-call basics, alerting thresholds.
- App Store / Play submission checklists and privacy labels. Extension store listings.
- Pilot plan for Texas: seed the network with 200 beta users across the 4 metros, grocery-first, with an in-app "invite 3 friends" that materially improves the user's own confidence scores (density is the growth loop — design the invite mechanic around it).
- Retailer relations playbook: a one-page "what we do and don't do" for retailers, and the takedown-response procedure.

---

## 11. Definition of done for the MVP

- A new engineer can clone, run `make dev`, and have the full stack with seed data in under 15 minutes.
- Founder can demo the two-button loop on a real phone against real and demo data.
- Integrity pipeline rejects the documented adversarial test suite.
- `/check` serves from aggregates at p95 < 300ms under load test.
- Evidence Export produces a bundle a lawyer could read.
- No affiliate code, no third-party ad or data SDKs, k-anonymity enforced in every export, privacy policy draft present.
- ADRs, README, RUNBOOK, THREAT_MODEL, PLAN, DEMO_SCRIPT, METRICS, and DECISIONS_NEEDED all exist and are current.

---

## 12. Open questions to raise with the founder in `docs/PLAN.md` (start here)

1. Final product name and domain (affects bot UA, bundle IDs, store listings).
2. Apple Developer and Google Play accounts — exist or need creating?
3. Hosting preference (Fly/Render/Supabase now vs. AWS from the start)?
4. Which 3–5 retailers for Phase 1 parsers? Recommended: H-E-B, Instacart, Uber (service tuple), Walmart, Kroger.
5. Is any LLM vendor preferred for extraction/adjudication? Budget cap per month?
6. Subscription price point for the paid tier?
7. Any existing brand assets, or should the admin/app use a neutral design system for now?
8. Counsel identified for privacy policy/ToS review and retailer-relations letters?
9. Which metros first for the 200-user beta?
10. Should the public aggregate API launch with the pilot or stay internal until Phase 3 data quality is proven?

Begin with step 1 of "How to work": write `docs/PLAN.md`, ask your questions, and wait.
