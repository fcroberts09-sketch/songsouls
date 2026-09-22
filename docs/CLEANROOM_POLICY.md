# Clean-room baseline fetch policy

This policy governs every automated request Parity makes to a retailer. It is enforced in code (Phase 1 fetcher) and tested. Deviations are bugs.

1. **Public pages only.** Never log in, never create or borrow accounts, never reuse a user's cookies or tokens server-side.
2. **Never solve, relay, or bypass a CAPTCHA, "press and hold," or JavaScript challenge.** A challenge response is a hard stop for that domain for 24 hours and is logged.
3. **robots.txt is parsed per RFC 9309 before every session.** A `Disallow: /` for `*` disables the domain automatically. Disallowed paths (`/search`, `/api/`, `/graphql`, `/typeahead`, `/store/ajax`) are never requested. Product-detail URLs only.
4. **Identified user agent:** `<Product>PriceCheck/<version> (+<bot page URL>; mailto:<contact>)`. No user-agent spoofing. No residential or rotating proxies. Static, published egress IPs with reverse DNS.
5. **Rate limits:** at most one request per domain per 10 seconds; at most 200 product fetches per domain per day; only on user demand; no scheduled full-catalog crawls. `Retry-After`, 429, and 403 are honoured with exponential backoff and a circuit breaker.
6. **Store only what is needed:** price stack, unit, timestamp, store or ZIP, product id. Raw HTML is retained at most 24 hours. We do not republish a bulk price database.
7. **Prefer official APIs** when they exist and their terms allow it (Kroger first). Never use an API in breach of its terms (Instacart and Uber forbid comparison use).
8. **Location** is set through the site's own guest store or ZIP picker, never a user's authenticated location.
9. **Cease-and-desist protocol:** any written objection from a domain owner disables that domain the same day, its data is purged on request, and counsel is notified. No re-entry via new IPs, user agents, or accounts.
10. **Per-domain feature flag defaulting off, plus a global kill switch** (`cleanroom.kill_switch`, which is ON by default and must be turned off deliberately).
11. **Legal review gate:** H-E-B (Texas law, Bexar County venue) and Walmart require counsel sign-off before enablement. Amazon, Instacart, Uber, and Lyft are off permanently unless their terms change.
12. **Every fetch is logged** with domain, URL, timestamp, status, robots decision, and flag state.

Mobile capture is separate from this policy: share extensions read only what the user shares (a URL or a screenshot) and never another app's data.
