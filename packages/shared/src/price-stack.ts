import { z } from 'zod';

/**
 * The full offer a shopper was shown. This is the unit of evidence.
 * Personalization increasingly lives in the label, not the sticker, so the discount
 * fields are as important as final_price.
 */
export const Money = z.number().finite().nonnegative();

export const DiscountType = z.enum([
  'none',
  'sale',
  'digital_coupon',
  'loyalty',
  'member',
  'promo_code',
  'bundle',
  'personalized',
  'unknown',
]);
export type DiscountType = z.infer<typeof DiscountType>;

export const Fee = z.object({
  kind: z.enum(['delivery', 'service', 'surge', 'booking', 'tax', 'other']),
  amount: Money,
  label: z.string().max(200).optional(),
});

export const PriceStack = z.object({
  currency: z.string().length(3).default('USD'),
  /** The crossed-out or "was" price if shown. Captured separately: retailers vary this even when sale price matches. */
  list_price: Money.nullable(),
  discount_amount: Money.nullable(),
  discount_label: z.string().max(200).nullable(),
  discount_type: DiscountType.default('none'),
  /** What the shopper would pay for the quantity shown, before fees. */
  final_price: Money,
  fees: z.array(Fee).default([]),
  quantity: z.number().positive().default(1),
  unit: z.string().max(40).nullable().default(null),
  /** Every promo, loyalty, or "just for you" badge text visible on the page. */
  promo_labels: z.array(z.string().max(200)).default([]),
  /** Algorithmic-pricing disclosure banner text if present (NY GBL 349-a, CT). */
  disclosure_text: z.string().max(2000).nullable().default(null),
});
export type PriceStack = z.infer<typeof PriceStack>;

export const CaptureMethod = z.enum([
  'extension_dom', // parsed from the rendered page by the browser extension
  'screenshot', // user-shared screenshot, extracted by OCR + LLM
  'share_url', // URL shared from a retailer app; yields identity, not the personalized price
  'manual', // typed by the user; corroborates only, never sets a minimum
  'baseline_api', // official retailer API, anonymous
  'baseline_cleanroom', // headless fresh-session fetch, anonymous
]);
export type CaptureMethod = z.infer<typeof CaptureMethod>;

/** Provenance ranking. Higher is more trustworthy. Manual can never set a minimum. */
export const CAPTURE_METHOD_WEIGHT: Record<CaptureMethod, number> = {
  extension_dom: 1.0,
  baseline_api: 1.0,
  baseline_cleanroom: 0.9,
  screenshot: 0.7,
  share_url: 0.5,
  manual: 0.2,
};
