# 0007. Plain partitioned Postgres instead of TimescaleDB

Status: accepted, 2026-09-22 (departs from the build brief)

## Decision
`observations` is a native Postgres table range-partitioned by month on `observed_at`. Daily rollups live in a real table (`aggregates_daily`) maintained by a worker calling `rollup_aggregates_daily()`, and updated incrementally on ingest in Phase 1. No TimescaleDB.

## Why
- Neon ships only the Apache-licensed TimescaleDB, which lacks continuous aggregates and compression; Supabase is winding Timescale down. The brief's hosting default and its Timescale design were incompatible.
- Continuous aggregates cannot easily produce `label_breakdown_json` or percentiles without the Timescale toolkit. A plpgsql rollup does both in 60 lines.
- A worker-maintained table is fresh on ingest, not after a refresh policy runs.
- Volume at 1M users is tens of millions of rows per month. Native partitioning handles that comfortably; partition pruning gives the same query benefit.

## Alternatives considered
- **Timescale Cloud**: would work, adds a vendor and a bill for features we can replicate.
- **Self-managed Timescale on Fly**: operational burden on a one-person team.
- **No partitioning**: fine for the pilot, painful for retention deletes later. Partitions make "drop raw captures older than 90 days" a `DROP TABLE`.

## Consequences
- A maintenance job must create future partitions (Phase 1). A default partition catches anything unexpected.
- If compression ever matters, Timescale can be adopted later; the table shape does not change.
