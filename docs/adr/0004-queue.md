# 0004. BullMQ on Redis for background jobs

Status: accepted, 2026-09-22

## Decision
Workers use BullMQ queues on the same Redis used for caching and rate limits (separate logical DB index). Queues: `identity`, `integrity`, `rollup`, `baseline`, `alerts`, `retention`.

## Why
- Boring and well documented. Retries, backoff, rate limiting per queue (the baseline fetcher needs "one request per domain per 10 seconds"), delayed jobs, and a dashboard.
- We already run Redis; no new infrastructure.

## Alternatives considered
- **Postgres-backed queues (pg-boss, Graphile Worker)**: fewer moving parts, but the baseline fetcher's per-domain rate limiting and the alert fan-out are exactly what BullMQ's limiter and job options handle out of the box.
- **SQS / Cloud Tasks**: vendor lock and no local story without emulators.

## Consequences
- Workers scale by queue depth, exposed as the `queue_depth` Prometheus gauge.
- Redis loss loses queued jobs. Every job must be re-derivable from Postgres (an observation without a review gets re-scored by a sweep), so this is acceptable.
