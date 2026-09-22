# Changelog

## Unreleased

### Phase 0, 2026-09-22
- Monorepo (pnpm workspaces): `apps/api`, `apps/admin`, `apps/mobile`, `apps/extension`, `packages/shared`, `packages/parsers`, `infra/`.
- Docker Compose (Postgres 16, Redis 7, MinIO) and `make dev`.
- Schema and migrations for the full data model, with `observations` range-partitioned by month and an append-only `integrity_reviews` chain.
- Daily rollup function with crowd distribution, label breakdown, baseline price, and twin-session noise floor.
- Seed: 4 retailers, 50 products, 4 service tuples, 160 devices, 2,000 crowd observations plus baseline twins, playbooks, flags, recipes. All synthetic.
- Fastify API with `/healthz`, `/readyz`, `/metrics`, `/v1/meta`; OpenTelemetry, pino, Prometheus, optional Sentry.
- Shared Zod contracts: price stack, observation submission, result card, metros, canonical content hash.
- CI: lint, format, typecheck, unit, migrate, seed, integration, build.
- ADRs 0001–0008, clean-room policy, threat model v0, research synthesis.
