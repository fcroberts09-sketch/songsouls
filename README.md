# Parity (working name)

Detects personalized ("surveillance") pricing. A shopper shares a price; Parity shows the distribution of offers other shoppers were shown for the same item at the same retailer in their metro, the anonymous baseline a stranger would see, and a retailer-specific playbook for getting the better offer. No affiliate links, no individual data sales, no account required to check a price. The same evidence-grade observations feed k-anonymized exports for regulators, plaintiffs' firms, and NY disclosure audits.

## Run it (about ten minutes on a laptop with Docker)
```
git clone <this repo> && cd <repo>
make dev
```
Then `curl localhost:4000/v1/meta`. See `docs/DEMO_SCRIPT.md` for what to look at, `docs/RUNBOOK.md` for operating it.

Prerequisites: Node 22 (`.nvmrc`), pnpm 10 (`corepack enable`), Docker with Compose.

## Where things are
- `apps/api`: Fastify API and workers, SQL migrations, seed.
- `apps/admin`: Next.js admin (parser editor, playbook editor, integrity queue, dashboards). Skeleton in Phase 0.
- `apps/mobile`: Expo app. Skeleton in Phase 0.
- `apps/extension`: Chrome MV3 extension. Skeleton in Phase 0.
- `packages/shared`: Zod contracts shared by everything (price stack, observation, result card, metros).
- `packages/parsers`: selector recipe schema, runner (Phase 1), fixtures.
- `docs/`: the brief, the plan, research, ADRs, policies, runbook.

## Read first
1. `docs/PLAN.md`: what we are building and the open questions.
2. `docs/RESEARCH.md`: why it is built this way.
3. `docs/adr/`: each architectural decision and the alternatives.
4. `docs/DECISIONS_NEEDED.md`: what the founder still has to decide.

Aivre, the previous occupant of this repository, is preserved at commit `843be1a`.
