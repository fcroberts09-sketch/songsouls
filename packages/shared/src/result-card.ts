import { z } from 'zod';

/**
 * What "Check this price" returns. Distributional by design: the literature says single-price
 * flags are mostly noise, so the card reports how many price points were seen, where the
 * shopper sits, and the anonymous baseline, with the sample size and window stated.
 */
export const Confidence = z.enum(['high', 'medium', 'low', 'insufficient']);
export type Confidence = z.infer<typeof Confidence>;

export const ResultCard = z.object({
  retailer: z.object({ slug: z.string(), name: z.string() }),
  product: z.object({
    id: z.string().uuid().nullable(),
    title: z.string().nullable(),
    identity_confidence: z.number().min(0).max(1),
  }),
  metro: z.string(),
  window_hours: z.number().int().positive(),
  you: z.object({ final_price: z.number(), discount_label: z.string().nullable() }),
  network: z
    .object({
      n_observations: z.number().int().nonnegative(),
      n_devices: z.number().int().nonnegative(),
      n_price_points: z.number().int().nonnegative(),
      min: z.number().nullable(),
      p10: z.number().nullable(),
      median: z.number().nullable(),
      max: z.number().nullable(),
      your_percentile: z.number().min(0).max(100).nullable(),
      dispersion_pct: z.number().nullable(),
      label_breakdown: z.record(z.string(), z.number()).default({}),
    })
    .nullable(),
  baseline: z
    .object({
      source: z.enum(['api', 'cleanroom']),
      final_price: z.number(),
      captured_at: z.string().datetime({ offset: true }),
      /** Disagreement between two identical anonymous sessions, measured, not assumed. */
      noise_floor_pct: z.number().nullable(),
    })
    .nullable(),
  confidence: Confidence,
  /** Plain-English reason, always present. */
  reason: z.string().max(400),
  /** Present whenever variation could be a randomized test rather than personalization. */
  caveat: z.string().max(400).nullable(),
  is_demo: z.boolean().default(false),
});
export type ResultCard = z.infer<typeof ResultCard>;
