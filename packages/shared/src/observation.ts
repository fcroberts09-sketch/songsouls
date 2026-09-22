import { z } from 'zod';
import { CaptureMethod, PriceStack } from './price-stack.js';
import { METRO_CODES } from './metros.js';

export const Platform = z.enum(['ios', 'android', 'chrome', 'safari', 'firefox', 'server']);
export type Platform = z.infer<typeof Platform>;

export const AttestationLevel = z.enum(['none', 'extension_token', 'app_attest', 'play_integrity']);
export type AttestationLevel = z.infer<typeof AttestationLevel>;

export const IntegrityStatus = z.enum(['pending', 'accepted', 'quarantined', 'rejected']);
export type IntegrityStatus = z.infer<typeof IntegrityStatus>;

/** Identity hints the client can supply. The server resolves these to a product. */
export const ProductIdentityHint = z.object({
  retailer_slug: z.string().min(1).max(60),
  native_id: z.string().max(200).nullable().default(null),
  gtin: z
    .string()
    .regex(/^\d{8,14}$/)
    .nullable()
    .default(null),
  url: z.string().url().max(2000).nullable().default(null),
  brand: z.string().max(200).nullable().default(null),
  title: z.string().max(500).nullable().default(null),
  size: z.string().max(100).nullable().default(null),
  variant: z.record(z.string(), z.string()).default({}),
});
export type ProductIdentityHint = z.infer<typeof ProductIdentityHint>;

/** Body of POST /observations. Signed by the device; see content hash below. */
export const ObservationSubmission = z.object({
  device_id: z.string().uuid(),
  device_nonce: z.string().min(16).max(64),
  observed_at: z.string().datetime({ offset: true }),
  metro: z.enum(METRO_CODES as [string, ...string[]]),
  h3_cell_coarse: z.string().max(16).nullable().default(null),
  identity: ProductIdentityHint,
  price: PriceStack,
  capture_method: CaptureMethod,
  /** Object key of the uploaded screenshot or raw capture, if any. Uploaded via pre-signed URL first. */
  capture_object_key: z.string().max(300).nullable().default(null),
  parser_version: z.string().max(40).nullable().default(null),
  app_version: z.string().max(40),
  /** Demo Mode submissions are stored but never aggregated with real data. */
  is_synthetic: z.boolean().default(false),
});
export type ObservationSubmission = z.infer<typeof ObservationSubmission>;

/**
 * Canonical JSON for hashing. Keys sorted, no whitespace. The content hash is what makes
 * ingestion idempotent and what the device signs. Changing this function changes every hash;
 * bump CONTENT_HASH_VERSION if you do.
 */
export const CONTENT_HASH_VERSION = 1;

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',')}}`;
}

/** Fields that define the content of an observation for hashing. Excludes transport-only fields. */
export function contentHashInput(o: ObservationSubmission): string {
  return canonicalJson({
    v: CONTENT_HASH_VERSION,
    device_id: o.device_id,
    device_nonce: o.device_nonce,
    observed_at: o.observed_at,
    metro: o.metro,
    identity: o.identity,
    price: o.price,
    capture_method: o.capture_method,
  });
}
