# 0002. Hosting: Fly.io + Neon + Upstash + Cloudflare R2, with an AWS path

Status: accepted pending founder confirmation (DECISIONS_NEEDED #4), 2026-09-22

## Decision
- API and workers: Fly.io machines, one Docker image, separate process groups for `api` and `worker`, scaled independently.
- Postgres: Neon (serverless Postgres 16, branching for staging). No TimescaleDB dependency (see ADR 0007).
- Redis: Upstash (cache, rate limits, BullMQ).
- Object storage: Cloudflare R2 (S3 API, zero egress fees; screenshots and exports are read by admins and lawyers, not by users).
- Edge: Cloudflare in front of the API for WAF, rate limiting, and bot management.

## Why
Cheapest path to a real staging and production with one person operating it. Every component has an S3, Postgres, or Redis wire protocol, so nothing in application code is vendor-specific.

## AWS path
ECS Fargate for api/worker, RDS Postgres 16, ElastiCache Redis, S3, CloudFront + WAF. Terraform modules in `infra/` will be written so that the provider block is the main difference. Estimated switching cost: about one week, mostly IAM and networking.

## Alternatives considered
- **Render**: comparable to Fly; Fly's process groups and regional placement (Dallas region exists) fit a Texas pilot better.
- **Supabase**: bundles auth and storage we do not need; Timescale support is being wound down, which would have forced ADR 0007 anyway.
- **AWS from day one**: correct at scale, but weeks of setup before the first demo. Not yet.

## Consequences
- Local development is Docker Compose (Postgres, Redis, MinIO), which mirrors the protocols exactly.
- `infra/` stays empty until Phase 4.
