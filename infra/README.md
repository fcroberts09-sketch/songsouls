# infra

Terraform for staging and production lands in Phase 4. The default target is Fly.io for API and workers,
Neon Postgres, Upstash Redis, and Cloudflare R2, with a documented path to AWS (ECS, RDS, ElastiCache, S3).
See `docs/adr/0002-hosting.md`. Until then, `docker-compose.yml` at the repo root is the only infrastructure.
