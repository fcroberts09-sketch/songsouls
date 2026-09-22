# 0005. Product identity resolution

Status: accepted, 2026-09-22

## Decision
Resolution order, stopping at the first hit, each step recording a confidence on the product:
1. **Retailer-native id** from the URL or page (Walmart `/ip/<slug>/<itemId>`, H-E-B `/product-detail/<slug>/<id>`, Kroger `/p/<slug>/<upc>`). Confidence 1.0.
2. **GTIN/UPC** within the same retailer. Confidence 0.95.
3. **Normalized tuple** (retailer, brand, title, size, variant) with `pg_trgm` similarity above 0.6, adjudicated by an LLM with a strict JSON schema when two candidates are within 0.1 of each other; below 0.6 a new product is created with confidence 0.5 and queued for human review.
4. **Service tuples** (rideshare, delivery, travel): origin H3 cell, destination H3 cell, service tier, time bucket, at resolution 5 so k-anonymity is reachable.

Rules that never change: never merge across retailers; store `identity_confidence` on the product and surface it on the card.

## Why
Every measurement study since 2012 named per-site parsing and identity matching as the reason detection did not scale. Native ids are stable and free; GTINs are the same across retailers but we only use them within one; fuzzy matching is the fallback, not the plan.

## Alternatives considered
- **Cross-retailer product graph**: explicitly out of scope; it is a different product and it invites the "compare stores" confusion.
- **Pure LLM matching**: expensive, non-deterministic, and unnecessary for the 90% of cases with a native id.

## Consequences
- Parser recipes must extract the native id from the URL before anything else.
- Screenshots without a visible native id go through step 3 and get a lower-confidence card, and the card says so.
