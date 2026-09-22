import { z } from 'zod';

/**
 * A selector recipe tells the extension how to read a retailer's product page.
 * Recipes are data: versioned rows in `parser_recipes`, hot-updatable from the backend,
 * tested against saved HTML fixtures. The runner that executes them lands in Phase 1.
 */
export const Extractor = z.object({
  /** CSS selector. First match wins unless `all` is true. */
  selector: z.string().min(1),
  /** Read an attribute instead of text content. */
  attr: z.string().optional(),
  /** Regex with one capture group applied to the raw text. */
  regex: z.string().optional(),
  all: z.boolean().default(false),
});

export const ParserRecipe = z.object({
  retailer_slug: z.string().min(1),
  version: z.number().int().positive(),
  /** URL patterns (regex) that identify a product page on this domain. */
  product_url_patterns: z.array(z.string().min(1)).min(1),
  /** Regex with one capture group that extracts the retailer-native product id from the URL. */
  native_id_from_url: z.string().min(1),
  fields: z.object({
    title: Extractor,
    brand: Extractor.optional(),
    size: Extractor.optional(),
    gtin: Extractor.optional(),
    final_price: Extractor,
    list_price: Extractor.optional(),
    discount_label: Extractor.optional(),
    promo_labels: Extractor.optional(),
    disclosure_text: Extractor.optional(),
  }),
  /** Guards: if any of these selectors match, the page is a login wall, error, or bot challenge. Do not parse. */
  do_not_parse_if: z.array(z.string()).default([]),
});
export type ParserRecipe = z.infer<typeof ParserRecipe>;
