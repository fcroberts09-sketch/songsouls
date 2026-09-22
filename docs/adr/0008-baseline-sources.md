# 0008. Baseline sources: official API first, clean-room second, never authenticated

Status: accepted, 2026-09-22

## Decision
The anonymous baseline (what a stranger sees) comes from, in order of preference:
1. An **official retailer API** with terms that allow reading prices (Kroger Public Products API today).
2. A **clean-room fetch**: fresh headless browser profile, no cookies, identified user agent, robots.txt obeyed per RFC 9309, no CAPTCHA solving, one request per domain per 10 seconds, on demand only, per-domain flag defaulting off, global kill switch.
3. Nothing. Instacart (`Disallow: /`), Uber and Lyft (API forbids comparison use), and Amazon (terms forbid a price database) get no baseline. Their prices reach us only from users' own screenshots.

Every baseline run is a pair of identical sessions (control twins). Their disagreement is stored as the noise floor and reported on cards and in exports.

## Why
`docs/research/04-scraping-law-baseline.md`: public, logged-off, non-circumventing fetching is protected by hiQ, Van Buren, and Meta v. Bright Data; every scraper that lost used accounts, solved challenges, or continued after a cease-and-desist. `docs/research/02-detection-literature.md`: control twins are what let IMC 2014 separate personalization from noise.

## Alternatives considered
- **Residential proxy pools and fingerprint spoofing**: what price-intelligence vendors do. It is also the conduct courts punish and it contradicts "provably on the shopper's side." No.
- **Third-party price data (Datasembly and similar)**: possible later for coverage; it is not an anonymous *session* price and cannot be used as a control twin.

## Consequences
- `docs/CLEANROOM_POLICY.md` is enforced in code, with tests, not just written down.
- Kroger requires a developer registration by the founder (DECISIONS_NEEDED #5).
