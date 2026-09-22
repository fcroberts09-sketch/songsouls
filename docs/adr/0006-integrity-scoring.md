# 0006. Integrity scoring as an append-only review chain

Status: accepted, 2026-09-22

## Decision
- `observations` is never updated. Every scoring decision is a row in `integrity_reviews` (score 0–100, status, scorer version, reasons). The effective status is the latest row (`observation_status` view).
- Scorers are pluggable functions, each returning a score delta and a reason. Phase 1 scorers: plausibility (z-score against the rolling product/metro distribution and hard bounds against list price), corroboration (minimum 3 distinct attested devices before a price becomes "lowest seen"), velocity (per-device rate, identical-content bursts), content hash and per-device HMAC with nonce (replay rejected). Phase 2 adds device attestation, emulator and ASN reputation, and location coherence.
- Manual entry can corroborate but never set a minimum. Unattested submissions cannot move the minimum.
- Aggregates use accepted observations only. Quarantined rows are visible in the admin queue; a human accept or reject appends a review with `reviewer` set.

## Why
Chain of custody. An evidence export must show how a row was scored, by which version, and who overrode it. Updating in place destroys that. It also honours the brief's "append-only" rule literally instead of carving out an exception.

## Threat model summary (full text in docs/THREAT_MODEL.md)
Retailers seeding fake low prices to discredit us, competitors, trolls, and users gaming the leaderboard. GasBuddy's spoofing came from station owners with a commercial motive; ours will too.

## Alternatives considered
- **Mutable `integrity_status` column**: simpler queries, no history. Rejected for evidence reasons.
- **Event-sourcing the whole observation**: overkill; the observation itself is immutable already.

## Consequences
- Result Card queries join through the view; the rollup function does too. Cost is negligible at pilot scale and the view can become a materialized column later without changing the contract.
