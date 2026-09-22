-- Daily rollup. Called by the aggregation worker (Phase 1) and by the seed script.
-- Uses only observations whose latest integrity status is 'accepted'.
-- Baseline observations (capture_method baseline_*) feed baseline_price and the noise floor;
-- they never count toward n, n_devices, or the crowd distribution.

CREATE OR REPLACE FUNCTION rollup_aggregates_daily(day_from date, day_to date)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  affected integer;
BEGIN
  WITH accepted AS (
    SELECT o.*
    FROM observations o
    JOIN observation_status s ON s.observation_id = o.id AND s.observed_at = o.observed_at
    WHERE s.status = 'accepted'
      AND o.product_id IS NOT NULL
      AND o.observed_at >= day_from
      AND o.observed_at < (day_to + 1)
  ),
  crowd AS (
    SELECT retailer_id, product_id, metro, is_synthetic,
           (observed_at AT TIME ZONE 'America/Chicago')::date AS day,
           count(*)::int AS n,
           count(DISTINCT device_id)::int AS n_devices,
           count(DISTINCT final_price)::int AS n_price_points,
           min(final_price) AS min,
           percentile_cont(0.1) WITHIN GROUP (ORDER BY final_price) AS p10,
           percentile_cont(0.5) WITHIN GROUP (ORDER BY final_price) AS median,
           max(final_price) AS max
    FROM accepted
    WHERE capture_method NOT IN ('baseline_api', 'baseline_cleanroom')
    GROUP BY 1, 2, 3, 4, 5
  ),
  labels AS (
    SELECT retailer_id, product_id, metro, is_synthetic, day,
           jsonb_object_agg(label, cnt) AS label_breakdown_json
    FROM (
      SELECT retailer_id, product_id, metro, is_synthetic,
             (observed_at AT TIME ZONE 'America/Chicago')::date AS day,
             coalesce(discount_label, 'none') AS label, count(*) AS cnt
      FROM accepted
      WHERE capture_method NOT IN ('baseline_api', 'baseline_cleanroom')
      GROUP BY 1, 2, 3, 4, 5, 6
    ) x
    GROUP BY 1, 2, 3, 4, 5
  ),
  baseline AS (
    SELECT retailer_id, product_id, metro, is_synthetic,
           (observed_at AT TIME ZONE 'America/Chicago')::date AS day,
           percentile_cont(0.5) WITHIN GROUP (ORDER BY final_price) AS baseline_price,
           CASE WHEN min(final_price) > 0
                THEN ((max(final_price) - min(final_price)) / min(final_price) * 100)::real
                ELSE NULL END AS baseline_noise_pct
    FROM accepted
    WHERE capture_method IN ('baseline_api', 'baseline_cleanroom')
    GROUP BY 1, 2, 3, 4, 5
  ),
  upserted AS (
    INSERT INTO aggregates_daily (
      retailer_id, product_id, metro, day, is_synthetic, n, n_devices, n_price_points,
      min, p10, median, max, dispersion_pct, label_breakdown_json, baseline_price, baseline_noise_pct, updated_at
    )
    SELECT c.retailer_id, c.product_id, c.metro, c.day, c.is_synthetic, c.n, c.n_devices, c.n_price_points,
           c.min, round(c.p10::numeric, 2), round(c.median::numeric, 2), c.max,
           CASE WHEN c.min > 0 THEN ((c.max - c.min) / c.min * 100)::real ELSE 0 END,
           coalesce(l.label_breakdown_json, '{}'::jsonb),
           round(b.baseline_price::numeric, 2), b.baseline_noise_pct, now()
    FROM crowd c
    LEFT JOIN labels l USING (retailer_id, product_id, metro, is_synthetic, day)
    LEFT JOIN baseline b USING (retailer_id, product_id, metro, is_synthetic, day)
    ON CONFLICT (retailer_id, product_id, metro, day, is_synthetic) DO UPDATE SET
      n = EXCLUDED.n, n_devices = EXCLUDED.n_devices, n_price_points = EXCLUDED.n_price_points,
      min = EXCLUDED.min, p10 = EXCLUDED.p10, median = EXCLUDED.median, max = EXCLUDED.max,
      dispersion_pct = EXCLUDED.dispersion_pct, label_breakdown_json = EXCLUDED.label_breakdown_json,
      baseline_price = EXCLUDED.baseline_price, baseline_noise_pct = EXCLUDED.baseline_noise_pct,
      updated_at = now()
    RETURNING 1
  )
  SELECT count(*) INTO affected FROM upserted;
  RETURN affected;
END;
$$;
