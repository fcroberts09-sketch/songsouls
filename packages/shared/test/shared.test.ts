import { describe, expect, it } from 'vitest';
import {
  CAPTURE_METHOD_WEIGHT,
  ObservationSubmission,
  PriceStack,
  canonicalJson,
  contentHashInput,
  metroForZip,
} from '../src/index.js';

describe('metros', () => {
  it('maps ZIP prefixes to pilot metros and rejects unknown ones', () => {
    expect(metroForZip('77002')).toBe('HOU');
    expect(metroForZip('75201')).toBe('DFW');
    expect(metroForZip('78701')).toBe('AUS');
    expect(metroForZip('78205')).toBe('SAT');
    expect(metroForZip('10001')).toBeNull();
  });
});

describe('PriceStack', () => {
  it('accepts a minimal offer and applies defaults', () => {
    const p = PriceStack.parse({
      list_price: null,
      discount_amount: null,
      discount_label: null,
      final_price: 4.29,
    });
    expect(p.currency).toBe('USD');
    expect(p.discount_type).toBe('none');
    expect(p.fees).toEqual([]);
  });
  it('rejects negative prices', () => {
    expect(() =>
      PriceStack.parse({
        list_price: null,
        discount_amount: null,
        discount_label: null,
        final_price: -1,
      }),
    ).toThrow();
  });
  it('never lets manual entry outrank any other capture method', () => {
    const manual = CAPTURE_METHOD_WEIGHT.manual;
    for (const [k, w] of Object.entries(CAPTURE_METHOD_WEIGHT))
      if (k !== 'manual') expect(w).toBeGreaterThan(manual);
  });
});

describe('content hash', () => {
  const base = {
    device_id: '4d5c2c6a-5b1e-4d2f-9a5c-1f2e3d4c5b6a',
    device_nonce: 'abcdefghijklmnop',
    observed_at: '2026-09-22T12:00:00Z',
    metro: 'HOU',
    identity: { retailer_slug: 'kroger', native_id: '0001111041660' },
    price: {
      list_price: 5.49,
      discount_amount: 1.2,
      discount_label: 'Digital Coupon',
      discount_type: 'digital_coupon',
      final_price: 4.29,
    },
    capture_method: 'screenshot',
    app_version: '0.0.1',
  };
  it('is stable across key order', () => {
    const a = ObservationSubmission.parse(base);
    const b = ObservationSubmission.parse({
      ...base,
      price: {
        final_price: 4.29,
        discount_type: 'digital_coupon',
        discount_label: 'Digital Coupon',
        discount_amount: 1.2,
        list_price: 5.49,
      },
    });
    expect(contentHashInput(a)).toBe(contentHashInput(b));
  });
  it('changes when the price changes', () => {
    const a = ObservationSubmission.parse(base);
    const b = ObservationSubmission.parse({ ...base, price: { ...base.price, final_price: 4.3 } });
    expect(contentHashInput(a)).not.toBe(contentHashInput(b));
  });
  it('drops undefined and sorts keys', () => {
    expect(canonicalJson({ b: 1, a: [2, { d: undefined, c: 3 }] })).toBe('{"a":[2,{"c":3}],"b":1}');
  });
});
