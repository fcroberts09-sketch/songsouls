import { z } from 'zod';

const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url().default('postgres://parity:parity@localhost:5432/parity'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('parity-captures'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().default('parity-api'),
  SENTRY_DSN: z.string().optional(),
  PRODUCT_NAME: z.string().default('Parity'),
  BOT_CONTACT_URL: z.string().default('https://example.invalid/bot'),
  BOT_CONTACT_EMAIL: z.string().default('bot@example.invalid'),
});
export type Config = z.infer<typeof Env>;

/** Parse process.env once. Empty strings are treated as unset so `.env.example` works verbatim. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) if (v !== undefined && v !== '') cleaned[k] = v;
  return Env.parse(cleaned);
}

/** The identified user agent every automated fetch must send. See docs/CLEANROOM_POLICY.md. */
export function botUserAgent(c: Config, version: string): string {
  return `${c.PRODUCT_NAME}PriceCheck/${version} (+${c.BOT_CONTACT_URL}; mailto:${c.BOT_CONTACT_EMAIL})`;
}
