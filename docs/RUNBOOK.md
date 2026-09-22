# Runbook (Phase 0)

## Run it locally
```
make dev          # Docker services + migrate + seed + API in watch mode
make check        # what CI runs: lint, format, typecheck, unit + integration tests
make reset        # drop schema, migrate, seed
```
Without Docker: point `DATABASE_URL` and `REDIS_URL` in `.env` at any Postgres 16 with `pg_trgm` and any Redis, then `make migrate seed api`.

## Kill the clean-room fetcher
Set the feature flag `cleanroom.kill_switch` to enabled (it is enabled by default in seed; nothing fetches until someone turns it off):
```sql
UPDATE feature_flags SET enabled = true, updated_at = now() WHERE key = 'cleanroom.kill_switch';
```
Per-domain: `UPDATE feature_flags SET enabled = false WHERE key = 'cleanroom.domain.heb.com';`

## Handle a takedown letter
1. Disable the domain the same day (above). 2. Purge that domain's raw captures on request. 3. Notify counsel. 4. Do not re-enter via new IPs, user agents, or accounts. Full policy: `docs/CLEANROOM_POLICY.md`.

## Deploy, rollback, rotate keys, backups
Phase 4. Until then there is no production.
