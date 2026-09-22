# Parity — Plan (gate 0: nothing gets built until this is answered)

Status: **waiting on founder answers** (section 4). Written 2026-09-22 on branch `claude/new-session-870fte`.

Confidence tags used below: **[Certain]** hard evidence, **[Likely]** strong inference, **[Guessing]** filling a gap.

---

## 0. Read this first: the repo is not empty, and three parts of the brief do not survive contact with reality

**The repo.** [Certain] `songsouls` is not an empty git repo. Its root is *Aivre*, a Next.js 15 appraisal workspace (`package.json`, `app/`, `lib/`, `components/`, a `.docx` brief). The brief for Parity says to start "inside an empty git repo" and to build a pnpm monorepo with `apps/*` and `packages/*` at the root. Those two things cannot both be true at the root of this repo. Question 1 below asks how you want that resolved. Nothing in this document depends on the answer, but Phase 0 does.

**Sharing a URL does not capture what the user was shown.** [Likely] When a shopper shares an H-E-B or Instacart product link into our app, our app (or its share extension) has none of the retailer app's cookies, login, or loyalty identity. If we fetch that URL, we see a *fresh-session* price, not the shopper's personalized price. The brief's capture-provenance ladder puts "share-sheet URL fetch by device" above "screenshot OCR", but for the thing we actually care about (the personalized offer), the URL path can only give us product identity plus a logged-out comparator. The shopper's own price on mobile comes from exactly two places: a screenshot, or a browser extension reading the rendered page. That means screenshot extraction is the primary mobile capture method, not a Phase 2 nicety. I have moved it into Phase 1 (section 5).

**At pilot density, "lowest seen in your metro" will usually be empty.** [Likely] 200 beta users across four metros is 50 per metro. H-E-B sells tens of thousands of SKUs. Corroboration needs three distinct attested devices on the same product, retailer, metro, and day before a price counts as "lowest seen". For most checks, the honest card at pilot scale is "not enough data". The brief already accepts that ("we say so and still give the playbook"), but an investor demo on real data will be thin. The one comparator that exists at n = 1 is the clean-room baseline: a no-cookie fetch of the same product for the same metro. "You were shown $5.49; a fresh anonymous session in Houston sees $4.99" is a real, defensible, single-user result. The brief schedules clean-room fetch for Phase 2. I recommend a minimal, per-domain-flagged, off-by-default version in Phase 1, and I need your sign-off because it is the one piece with retailer-relations exposure (question 5).

**Rideshare in the pilot is demo-only.** [Likely] Uber and Lyft fare screens have no shareable URL, so capture is screenshot-only, and the product is a (origin cell, destination cell, tier, time bucket) tuple. Getting k ≥ 10 or even N ≥ 3 on one such tuple needs far more density than a 200-user pilot. Uber stays in the seed data as the service-tuple example and in Demo Mode. Real rideshare comparisons are a post-pilot outcome. I have not removed it from the plan; I have stopped pretending it produces pilot data.

---

## 1. The product, restated

A shopper is on a retailer's app or site and sees a price. They share it into Parity ("Check this price"). Parity works out which product it is, records the full offer they were shown (list price, discount label, final price, fees, promo text, any disclosure banner) as an evidence-grade, pseudonymous observation, and answers one question: **did other people at this retailer, in this metro, today, get a better offer for the same thing?** The answer carries a confidence level and a one-line reason. The second button ("Get the better price") gives a retailer-specific list of things that have historically produced the better offer, and the shopper reports whether each step worked, which re-ranks the list for everyone.

Every shopper who checks a price also contributes one, which is the growth loop: more shoppers in a metro means higher confidence for each of them.

Underneath, the same observation store feeds three revenue lines without a rewrite: the consumer subscription, NY algorithmic-pricing disclosure audits for retailers, and k-anonymized evidence bundles for plaintiffs' firms, AGs, and journalists.

Three things it is not: it is not a cross-retailer price comparison, it takes no affiliate money, and it never logs into a retailer on the shopper's behalf.

---

## 2. Assumptions I am working under

Product and market
- [Certain, from the brief] Texas consumer pilot; grocery first; NJ/NY/CA are data-product markets. No affiliate links ever.
- [Likely] The personalized part of a grocery offer is almost always a *label* (digital coupon, member price, "just for you"), so `discount_label` and `discount_type` are the most analytically important columns we store, above `final_price`.
- [Guessing] Investors will react to dispersion by retailer and the "estimated annual household cost" number more than to anything on the consumer side. The admin dispersion dashboard is therefore not a Phase 3 afterthought in effort terms; it is the pitch.

Mobile
- [Likely] The iOS share extension needs a native extension target. Expo supports this through config plugins and EAS development builds, not Expo Go. Every phone demo requires an EAS or local Xcode build, which requires an Apple Developer account. Android share targets are simpler and can be tested without a store account.
- [Certain] App Attest, Play Integrity, and RevenueCat all require the store accounts and app records to exist. Phase 2 cannot start until they do.
- [Certain] I cannot build or sign iOS binaries from this environment. I can produce a correct Expo/EAS configuration; the founder (or EAS cloud with your credentials) runs the build.

Backend
- [Likely] Neon offers only the Apache-licensed TimescaleDB, which lacks continuous aggregates and compression. Supabase has been winding down TimescaleDB support. The brief's default hosting stack and its Timescale continuous-aggregate design conflict. See recommendation in section 3.
- [Likely] Observation volume at 1M users is on the order of tens of millions of rows per month. Plain Postgres with native range partitioning handles that without an extension.
- [Certain] "Observations are append-only" and "human review changes `integrity_status`" conflict as written. Resolved in section 3.

Legal
- [Guessing] Passive observation of what the shopper's own device rendered is the low-risk core. Clean-room fetching is the piece counsel will care about. Everything in that path defaults to off.

---

## 3. Where I disagree with the brief, and what I will do instead

1. **Screenshot extraction moves from Phase 2 to Phase 1.** Reason: section 0. Without it, mobile checks record no personalized price. Phase 1 uses server-side vision extraction with a strict JSON schema (needs question 7 answered); Phase 2 adds on-device OCR as a cheaper first pass and the PII redaction step. Risk in the brief's ordering: a Phase 1 demo that "works" only because the URL path silently reports the logged-out price as if it were the shopper's.

2. **Clean-room baseline fetch moves to Phase 1, minimal and off by default.** Reason: section 0. It is the only comparator that exists at n = 1. Scope in Phase 1: one Playwright worker, fresh profile, identified user agent, robots.txt check, per-domain flag defaulting off, global kill switch, per-domain rate limit, every fetch logged. The IP pool and scale-out stay in Phase 2. Risk in my approach: retailer relations. That is why it is a question, not a decision.

3. **Plain partitioned Postgres instead of TimescaleDB, with worker-maintained aggregates instead of continuous aggregates.** Reason: it removes the hosting constraint above, and continuous aggregates cannot easily produce the `label_breakdown_json` column or percentiles without the Timescale toolkit. Instead, the ingestion worker upserts into a real `aggregates_daily` table on every accepted observation, so a Result Card is fresh immediately rather than after a refresh policy runs. Migration to Timescale later is a drop-in if we ever need compression. Risk: we own the rollup logic and its tests. That is a small, well-understood job.

4. **Integrity decisions live in an append-only side table.** `observations` never changes after insert. `integrity_reviews` holds every score, status, scorer version, and reviewer decision; the effective status is the latest row. This gives a clean chain of custody for evidence exports and honours "never update in place" literally.

5. **The "same time" window is a calendar day per metro in Phase 1.** Hourly buckets are computed but not shown until density supports them. Showing hourly at pilot scale produces mostly "not enough data".

6. **Framework, ORM, queue.** I will write ADRs after your answers, but so you can object early: Fastify (smaller, faster, less magic than Nest, easier for a non-engineer to read), Drizzle (SQL-first, plays well with partitioned tables and raw aggregate queries), BullMQ on Redis (as specified), pnpm workspaces with Turborepo for task caching.

7. **Free-tier limits keyed on `device_id` are resettable by reinstall.** Accepted risk in the brief's no-account model. I will not add an account requirement to fix it. Note it, move on.

Everything else in the brief I intend to follow as written.

---

## 4. Open questions for the founder (answer in order; 1, 3 and 5 gate real work)

1. **Where does Parity live?** This repo's root is Aivre. Options: (a) **recommended:** a new dedicated repo, and I start clean there; (b) move Aivre into `apps/aivre/` or its own branch and put the Parity monorepo at this repo's root; (c) build Parity under a `parity/` subdirectory here, accepting a nested monorepo and permanently awkward CI. I recommend (a). If you pick (b), say whether Aivre must keep working.

2. **Product name and domain.** "Parity" is a working name. The bot user agent, bundle identifiers, the extension IDs, and the privacy policy all need the real one. A placeholder is fine for Phase 0 but renaming bundle IDs after a store submission is painful.

3. **Apple Developer, Google Play, and Expo (EAS) accounts.** Do they exist? Who owns them? Without them: no iOS share-extension builds on a real phone, no App Attest or Play Integrity, no RevenueCat. This is the critical path for Phase 1's phone demo and all of Phase 2.

4. **Hosting.** Confirm the brief's default (Fly.io for API and workers, Neon Postgres, Upstash Redis, Cloudflare R2) plus my change to plain partitioned Postgres (section 3, item 3). Or say "AWS from day one" and I will write the Terraform for ECS, RDS, ElastiCache, and S3 instead. Either is fine; switching later costs about a week.

5. **Clean-room baseline fetch in Phase 1.** Approve or reject the off-by-default minimal version described in section 3, item 2. If approved, which domains may be enabled for internal testing first? If rejected, understand that mobile checks at pilot scale will mostly return "not enough data" until the network is dense.

6. **Phase 1 retailers.** I propose H-E-B, Instacart, Walmart, and Kroger for web parser recipes and screenshot extraction, with Uber as synthetic seed and Demo Mode only. Object or confirm.

7. **LLM vendor and monthly budget cap** for screenshot extraction and identity adjudication. Now a Phase 1 dependency (section 3, item 1). If you have no preference, I will pick one in an ADR and default the cap to a low number with a hard stop.

8. **Paid tier price, and acceptance of device-keyed free-tier limits** (section 3, item 7).

9. **Counsel.** Is someone identified for privacy policy, ToS, the clean-room policy, and retailer letters? Until then everything legally sensitive ships behind a flag defaulting off and is listed in `docs/DECISIONS_NEEDED.md`.

10. **Beta metro order, brand assets, and public API timing.** My defaults if you say nothing: Houston first, then Austin, DFW, San Antonio; a neutral design system until brand assets exist; the public aggregate API stays internal until Phase 3 data quality is proven.

---

## 5. Phase plan (brief's phases with the changes above applied)

Timelines below are yours, not mine. My throughput is not the bottleneck; the accounts, hosting credentials, and legal answers are.

### Phase 0 — Foundation
- Monorepo: `apps/api`, `apps/admin`, `apps/mobile`, `apps/extension`, `packages/shared` (types, price-stack schema, zod validators), `packages/parsers`, `infra/`.
- Docker Compose: Postgres 16 (partitioned observations), Redis, MinIO. `make dev` brings it all up with seed data.
- CI: lint, format, typecheck, unit, integration. Health endpoints. OpenTelemetry and structured logs wired.
- Schema and migrations for section 8 of the brief, plus `integrity_reviews` as described. Seed: H-E-B, Instacart, Uber; 50 products; 2,000 synthetic observations across Houston, DFW, Austin, San Antonio with `is_synthetic = true`.
- ADRs: framework, hosting, ORM, queue, identity resolution, integrity scoring, and the Postgres-not-Timescale decision.
- Blocked by: question 1. Softened by: question 4 (Compose works regardless).

### Phase 1 — Core loop, end to end
- API: `POST /observations`, `POST /check`, `GET /playbooks/:retailer`, `POST /playbook-feedback`, plus pre-signed upload URLs for screenshots.
- Identity resolution v1: native ID, GTIN, normalized tuple with `pg_trgm`, confidence stored.
- Integrity v1: plausibility, corroboration N ≥ 3, velocity, content hash and HMAC per device key, quarantine queue.
- Aggregation v1: worker-maintained `aggregates_daily` with dispersion score; Redis card cache.
- **Screenshot extraction v1** (moved in): vision model with strict schema and confidence; screenshot kept as evidence.
- **Clean-room baseline v1** (moved in, off by default): as scoped in section 3.
- Mobile: onboarding, share extension (URL and screenshot), Result Card with "you vs. baseline vs. network", Playbook, My Checks, Demo Mode.
- Chrome extension: passive collector for the seed retailers with selector recipes and HTML fixtures; inline check.
- Admin: parser recipe editor, playbook editor, integrity review queue, feature flags.
- Demo checkpoint: founder screenshots an H-E-B item, shares it, and gets a card with a lower observed offer and a playbook, on stage, in Demo Mode. Also works on real data whenever the baseline flag is on for that domain.
- Blocked by: questions 3 (phone build), 5, 7.

### Phase 2 — Trust and scale hardening
- App Attest and Play Integrity; signed extension tokens; attested-only minimums.
- On-device OCR pre-pass; PII redaction step before storage.
- Clean-room scale-out: IP pool, per-domain concurrency, cost guardrails. Rideshare screenshot extraction for the service-tuple path.
- Edge rate limits; load test `POST /check` to 1k RPS with p95 under 300 ms; document results.
- Watches and push alerts. RevenueCat subscription with free-tier limits.
- Safari Web Extension packaging.
- Data subject export and delete endpoints. Retention jobs.
- Blocked by: question 3 entirely.

### Phase 3 — Investor and evidence surfaces
- Dispersion dashboard with the household-cost model and its documented assumptions.
- Evidence Export (PDF and CSV, k ≥ 10, methodology page). NY disclosure audit report.
- Public read-only aggregate API with keys and quotas; OpenAPI spec.
- `docs/INVESTOR_DEMO.md` and `docs/METRICS.md`.

### Phase 4 — Pilot launch readiness
- Terraform for staging and production; secrets; backup and restore drill.
- Runbook, alerting thresholds, store submission checklists and privacy labels, extension listings.
- Texas pilot plan: 200 beta users, grocery first, "invite 3 friends" mechanic tied to the user's own confidence scores.
- Retailer relations one-pager and takedown procedure.

---

## 6. What happens when you answer

Same session or a new one: I write the ADRs, then Phase 0, and stop again at the end of Phase 0 with `docs/DEMO_SCRIPT.md` showing what you can demonstrate. Until you answer question 1, I will not create a single non-docs file in this repo.
