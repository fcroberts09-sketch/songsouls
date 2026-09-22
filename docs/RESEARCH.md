# Research verdict: is the crowd + baseline + no-cash design the right, scalable product?

Date: 2026-09-22. Five parallel literature and press searches (about 400 queries, roughly 90 primary sources). Full reports with every source URL are in `docs/research/`. Confidence tags: **[Certain]** fetched primary source, **[Likely]** strong secondary evidence, **[Guessing]** inference.

## Verdict in one paragraph

The mechanics are confirmed. The business you described is not the business the evidence supports. Same-retailer, cross-customer comparison is unoccupied by any funded product, the automated baseline is the load-bearing component, screenshots are the only mobile capture path, and cash-for-submissions is contradicted by fifty years of evidence and by every receipt-rewards fraud team. But the research also says four things the brief did not: the most visible target (Instacart item price tests) is already gone; the remaining personalization lives in promotions and loyalty, which every enacted law exempts; a consumer tool that flags single prices will mostly emit false positives; and the strongest external demand is from plaintiffs' firms and regulators, not from consumers. The correct product is therefore an evidence engine with a free consumer app as its collection layer, not a consumer subscription app with an evidence side business. Details, corrections, and plan changes follow.

## The twelve findings that change decisions

1. **[Likely] Nobody has shipped this.** Every consumer price tool is cross-retailer, price-history, or coupon. The only same-architecture attempt is an unfunded, zero-star open-source extension (Natural Price, AGPL, European sites). Academic tools ($heriff 2013, Northeastern 2016) are dead. Consumer Reports collected exactly our data by hand twice, with 174 to 437 volunteers, and has no tool. Whitespace is real. It partly exists because the easy target vanished. (`05-competitors-market.md` F1–F8)

2. **[Certain] Instacart ended item price tests on Dec 22, 2025, and the Consumer Reports study found randomized A/B assignment, not demographic targeting.** Regressions on age, gender, race, income found "small and not statistically meaningful" differences. Instacart's rebuttal notes the headline 23% gap was $0.70. Promotions and discounts by retailers and brands continue, and Instacart told the NY AG that partners "may use behavioral data to inform discounts." (`02-detection-literature.md` F9–F10)

3. **[Certain] Every enacted law exempts discounts, promotions, and loyalty programs.** Connecticut, the pending NY One Fair Price Act, and the federal grocery bill all carve them out. Personalization is migrating exactly there. Our offer-stack capture (list price, discount label, discount type, final price) was already the right instinct. It is now the whole product, and the legal hook on that data is weaker than the brief assumes. (`05` F18, `02` F17–F20)

4. **[Certain] Individual price flags are mostly noise; only aggregates are defensible.** Hannak et al. (IMC 2014) could only report personalization *rates* after running control-twin accounts, never call one price personalized. Airline fares moved within one minute (Vissers 2014). The EU's 160-site study found differences in 6% of tests, median 1.6%. BLS accepted crowdsourced gas prices into the CPI only after a 3.5-year parallel test showed aggregate error under 1%, while individual GasBuddy station prices are widely disbelieved. The Result Card must be distributional ("4 price points seen today; 31% of shoppers saw at or below the baseline") with an explicit "could be an A/B test" caveat, not "someone saw $X." (`02` §4–5, `01` F11–F12)

5. **[Certain] Paying for submissions is contradicted by the evidence and invites the fraud economy.** Deci-Koestner-Ryan meta-analysis (128 studies): contingent tangible rewards undermine intrinsic motivation. Gneezy-Rustichini: tiny pay performs worse than no pay, and once a price is introduced the norm never returns. Mason-Watts: pay buys quantity, not accuracy. Fetch reports about 2% of all activity is fraud; Ibotta's 10-K discloses counterfeit receipts and account takeovers as material. MTurk's 2018 crisis: 20–27% of paid respondents were VPS-based fraud. (`03-incentive-psychology.md` F1–F7, F12–F16)

6. **[Certain] The savings-share kickback has no supporting evidence and every adjacent finding is negative.** It is contingent cash, it creates an attribution lottery that rewards fabricated low prices, it needs accounts and payout rails we do not have, and inequity aversion means contributors feel underpaid. The salvageable fragment is symbolic: "your report saved 42 people $3.10 this week." (`03` recommendation d)

7. **[Certain] What works: zero-cost automatic contribution, symbolic recognition, and area-level unlock thresholds.** Barnstars raised Wikipedia top-editor output 60%; symbolic awards raised newcomer retention about 20% for four quarters. Glassdoor's give-to-get reduced polarized reviews without collapsing volume. Blind unlocks a company at 30 verified employees; Nextdoor needs 10 households in 21 days. Waze in 2023 moved gamification to onboarding only. Subscription revenue does not crowd out contribution as long as contribution is never gated by payment and paid users cannot opt out of contributing. (`03` F8–F11, F17–F18, F23; `01` F13, F18)

8. **[Certain] Every crowd-data platform that collapsed trust did it through side monetization of contributors, never through bad data.** GasBuddy sold location data at $9.50 per 1,000 users and embedded an insurer's driving-behavior SDK (Texas AG suit, Jan 2025). Premise took military tasking. Glassdoor de-anonymized users. Basket, the closest grocery analog, died from physical-store dependency and a funding accident, not fraud. Our "no individual data ever leaves" rule is the brand, and evidence licensing must stay k-anonymized aggregate. (`01` F8–F9, F14–F15, F18)

9. **[Certain] The baseline fetcher is legally sound only for public pages, no login, no CAPTCHA solving, low volume.** hiQ v. LinkedIn (9th Cir. 2022), Van Buren (2021), Meta v. Bright Data (2024) all protect logged-off public fetching. Every scraper that lost (hiQ's settlement, Ryanair v. Booking, Southwest v. Kiwi) used accounts, continued after a cease-and-desist, or both. Google v. SerpApi shows CAPTCHA circumvention invites DMCA claims. Volume is what keeps trespass-to-chattels claims dead. (`04-scraping-law-baseline.md` F1–F10)

10. **[Certain] The retailer list in the brief does not survive the robots.txt and terms check.**
    - Instacart: robots.txt is `User-agent: * / Disallow: /`, terms cite robots.txt, developer terms forbid multi-retailer price display. **No baseline, ever.** User screenshots only.
    - Uber/Lyft: API forbids comparison use; no shareable fare URL. **Screenshots only.**
    - Amazon: terms explicitly forbid a "database that features our prices"; aggressive enforcement. **Off.**
    - Kroger: free, self-serve, no-affiliate Public Products API with store-localized regular and promo prices. **Best pilot baseline, no scraping needed.** Operates in Houston and DFW.
    - H-E-B: no API; explicit anti-scraping terms; Texas law and Bexar County venue; product-detail pages allowed by robots.txt and returned 200. **Counsel-gated.**
    - Walmart: robots allows product pages; terms forbid; PerimeterX challenge on first request; affiliate-gated API with ZIP-localized prices. **Counsel-gated, and the API needs an affiliate-program decision.** (`04` F11–F18, risk matrix)

11. **[Certain] Demand is strongest where the brief put it third.** Two JetBlue class actions and the Washington Post case were filed on a tweet and a renewal email; plaintiffs' counsel say on record "you actually don't know if you've been harmed." New Jersey's private right of action starts Aug 1, 2027. NY's One Fair Price Act (private right of action, $500–$5,000 per violation) awaits the governor's signature by Dec 31, 2026. The FTC's Aug 19, 2026 policy statement, the CA AG sweep, and 30+ congressional letters all ask one question: are two consumers seeing different prices? No vendor sells the answer. Consumer subscription is the weakest line: every incumbent is free, and the most visible harm has been "fixed." (`05` F13–F16, demand ranking)

12. **[Certain] Mobile capture is what section 0 of the plan said.** iOS share extensions receive only the shared URL, text, or image; no cookies, no other app's data. Android is the same. The user's personalized price reaches us by screenshot or extension DOM, nothing else. (`04` F21)

## Corrections to the brief's premise section

| Brief says | Evidence says |
|---|---|
| NY label law upheld Oct 2025 | Upheld at district court Oct 8, 2025; NRF appeal pending in the Second Circuit |
| MD, CT, NJ grocery bans | MD and NJ are grocery. CT covers all retail sellers and delivery, plus a disclosure regime |
| NJ $50k/violation, treble, private right of action | Confirmed. $50k is the AG remedy; treble only if willful; effective Aug 1, 2027 |
| CA AB 2564 moving | Died Aug 31, 2026 without Assembly concurrence. AG sweep (Jan 27) is real |
| FTC proposed policy Aug 2026 | Confirmed, Aug 19, 2–0 vote, disclosure-only, no ban authority claimed |
| House Oversight investigating travel | Confirmed for Mar 5 letters. The August airline letters were Energy & Commerce Democrats |
| Texas no statute, 2027 | Confirmed. SB 2567 died in committee 2025 |
| Instacart "killed the item-price experiment but still allows promotions" | Confirmed, and the study found randomized tests, not personal-data targeting |
| Uber: 29 prices for 55 riders | Confirmed (CR, June 2026, Kansas City, Lyft). Median route spread 42.4%. CR did not control for supply, ETA, or routing |

## What changes in the plan

1. **Revenue priority flips.** Evidence licensing and compliance audits are the business; the consumer app is the collection layer and the brand, likely free with a low-priced paid tier for alerts and watches. Phase 3's evidence export moves earlier. RevenueCat and the paywall move later. The investor deck leads with the regulatory clock: NJ private right of action in Aug 2027, NY pending.

2. **Phase 1 retailers become: Kroger (API baseline), H-E-B (counsel-gated scrape), Walmart (counsel-gated), Instacart and Uber (screenshot capture only, no baseline).** Kroger goes first because it is the only legally clean baseline source and it covers Houston and DFW. This is a change from the brief's H-E-B-first ordering.

3. **The Result Card reports distributions and rates, never a single accusatory price.** Show "n price points seen," the user's percentile, the anonymous baseline, k and the time window, and a plain caveat that variation may be a randomized test. "Lowest seen" appears only at k ≥ 3 attested devices within the window and decays out of view after a configurable number of hours.

4. **Incentive design is fixed in writing:** every check is a contribution; no cash per submission, ever; no savings-share kickback; symbolic recognition and "your data helped n people" feedback; store or metro unlock thresholds instead of per-user gates; contribution never gated by payment. Coverage missions, if ever, are in-kind or lottery, capped, attested-only, Phase 4 at the earliest.

5. **The clean-room fetcher gets a written policy (`docs/CLEANROOM_POLICY.md`) that is enforced in code:** robots.txt parsed per RFC 9309 before every session, `Disallow: /` disables a domain automatically, any challenge response is a 24-hour hard stop, identified user agent with contact address, static published egress IPs, no proxies, one request per domain per 10 seconds, on-demand only, raw HTML kept 24 hours, same-day disable on any written objection.

6. **The offer stack is the product.** Reference price and discount are captured separately because Instacart varied reference prices even when sale prices matched. Promo label, loyalty label, and disclosure banner text are first-class, indexed columns.

7. **Control twins enter the architecture.** For any retailer where we run a baseline, we run two identical baseline sessions and record their disagreement as the noise floor. Personalization claims in evidence exports are stated as rates above that floor, the way IMC 2014 did it.

8. **Ground-truth panel.** A small paid, instructed panel (the Cavallo / BLS model) periodically checks a fixed basket so we can publish agreement statistics between crowd data and enumerated data. This is what made BLS trust a crowd feed, and it is what an expert witness will ask for.

## What the research did not settle

- Whether the Kroger Public API's terms permit displaying its prices next to user-observed prices, and its daily quota. Apply and read the terms.
- Whether Walmart's affiliate-program membership, required for its API, is compatible with a no-affiliate brand. My view: joining a program to read prices is not the same as earning commissions, but it must be disclosed and counsel should confirm.
- Willingness to pay for a pure detection utility. No data exists. Treat the paid tier as an experiment, not a plan.
- Whether personalized promotions produce enough measurable spread in Texas grocery to make the consumer card interesting week to week. The pilot answers this.
- Governor Hochul's action on the NY One Fair Price Act (deadline Dec 31, 2026) and the Second Circuit's ruling on the NY label law.
