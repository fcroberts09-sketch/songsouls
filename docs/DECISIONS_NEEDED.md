# Decisions needed from the founder (running list)

Newest at the bottom. Resolved items move to the "Resolved" section with the decision and date.

## Open

| # | Decision | Blocks | Raised |
| --- | --- | --- | --- |
| 2 | Product name and domain | bundle IDs, bot UA, legal drafts | PLAN Q2 |
| 3 | Apple Developer, Google Play, EAS accounts | phone builds, Phase 2 | PLAN Q3 |
| 4 | Hosting: Fly + Neon + Upstash + R2 vs AWS; confirm plain partitioned Postgres over Timescale | Phase 0 ADRs | PLAN Q4 |
| 5 | Clean-room baseline fetch in Phase 1, off by default; which domains for internal testing | Phase 1 | PLAN Q5 |
| 6 | Phase 1 retailers: H-E-B, Instacart, Walmart, Kroger; Uber synthetic only | Phase 1 parsers | PLAN Q6 |
| 7 | LLM vendor and monthly budget cap | Phase 1 screenshot extraction | PLAN Q7 |
| 8 | Paid tier price; accept device-keyed free-tier limits | Phase 2 | PLAN Q8 |
| 9 | Counsel for privacy policy, ToS, clean-room policy, retailer letters | anything legally sensitive leaves flag-off | PLAN Q9 |
| 10 | Beta metro order, brand assets, public API timing | Phase 3 and 4 | PLAN Q10 |

## Resolved

| # | Decision | Outcome | Date |
| --- | --- | --- | --- |
| 1 | Where Parity lives | This repo, root. Aivre removed from the branch; preserved in git history at commit 843be1a on `main` (tag `aivre-v1-final` must be pushed from the founder's machine; this session cannot push tags). Repo is still named `songsouls`; rename is cosmetic and can wait for the product name (Q2). | 2026-09-22 |
