# Backlog

Issue-style list. Every TODO in code must reference an item here.

| ID | Phase | Item |
|---|---|---|
| B-001 | 1 | Partition maintenance job: create next 3 monthly partitions, alert if fewer than 2 remain. |
| B-002 | 1 | Incremental aggregate upsert on ingest so cards are fresh without waiting for the rollup sweep. |
| B-003 | 1 | Parser recipe runner in `packages/parsers` with fixture tests for Kroger, H-E-B, Walmart, Instacart. |
| B-004 | 1 | Kroger Public Products API baseline adapter (needs developer registration, DECISIONS_NEEDED #5). |
| B-005 | 1 | Clean-room fetcher with policy enforcement tests (robots.txt, challenge stop, rate limit, kill switch, control twins). |
| B-006 | 1 | Screenshot extraction: vision model with strict JSON schema; vendor per DECISIONS_NEEDED #7. |
| B-007 | 1 | Per-device HMAC key issuance and signed submission verification. |
| B-008 | 2 | Retention jobs: raw captures 90 days, screenshots 30 days unless flagged as evidence; implemented as partition drops where possible. |
| B-009 | 2 | Evidence export with k ≥ 10 property tests. |
| B-010 | 0 | Admin `next-env.d.ts` is generated on first `next dev`; typecheck runs without it. Revisit if Next changes this. |
| B-011 | 3 | Ground-truth panel protocol and agreement statistics. |
