# Demo script

What the founder can show at the end of each phase. Each section is cumulative.

## Phase 0 (current): the foundation runs and the data model is real

Laptop, terminal, ten minutes.

1. `make dev` from a fresh clone. Within a few minutes: Postgres, Redis, MinIO up; migrations applied; seed loaded; API listening on port 4000.
2. `curl localhost:4000/v1/meta | jq`. Show the four Texas metros, the identified bot user agent, and the principles block: no affiliate revenue, no individual data sales, no account required, k ≥ 10.
3. `curl localhost:4000/readyz`. Green when Postgres and Redis answer; 503 otherwise. `curl localhost:4000/metrics` shows Prometheus output.
4. `psql $DATABASE_URL` and run:
   ```sql
   SELECT r.name, p.title_norm, a.metro, a.day, a.n, a.n_devices, a.n_price_points,
          a.min, a.median, a.max, a.dispersion_pct, a.baseline_price, a.baseline_noise_pct, a.label_breakdown_json
   FROM aggregates_daily a JOIN retailers r ON r.id = a.retailer_id JOIN products p ON p.id = a.product_id
   WHERE a.is_synthetic ORDER BY a.dispersion_pct DESC LIMIT 10;
   ```
   Talk through one row: "12 shoppers in Houston, 4 price points, 18% spread, the anonymous baseline sat at the list price, the noise between two identical anonymous sessions was under 1%, and the cheapest offers carried the label Digital Coupon." That sentence is the product.
5. Show `docs/RESEARCH.md` section "What changes in the plan" and `docs/CLEANROOM_POLICY.md`. Investors and counsel will ask about both.
6. Everything shown is marked `is_synthetic = true`. Say so.

## Phase 1: the two-button loop on a phone
(to be written at the end of Phase 1)
