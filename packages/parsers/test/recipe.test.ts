import { describe, expect, it } from 'vitest';
import { ParserRecipe } from '../src/index.js';

describe('ParserRecipe', () => {
  it('validates a minimal recipe', () => {
    const r = ParserRecipe.parse({
      retailer_slug: 'heb',
      version: 1,
      product_url_patterns: ['^https://www\\.heb\\.com/product-detail/'],
      native_id_from_url: '/product-detail/[^/]+/(\\d+)',
      fields: {
        title: { selector: 'h1' },
        final_price: { selector: '[data-qe-id="productPrice"]', regex: '\\$([0-9.]+)' },
      },
    });
    expect(r.fields.final_price.all).toBe(false);
    expect(r.do_not_parse_if).toEqual([]);
  });
  it('requires a way to extract the native id', () => {
    expect(() =>
      ParserRecipe.parse({
        retailer_slug: 'x',
        version: 1,
        product_url_patterns: ['a'],
        fields: { title: { selector: 'h1' }, final_price: { selector: 'p' } },
      }),
    ).toThrow();
  });
});
