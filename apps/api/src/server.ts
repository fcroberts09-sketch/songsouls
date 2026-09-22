import { loadConfig } from './config.js';
import { startTelemetry } from './otel.js';

const config = loadConfig();
// Telemetry must start before the HTTP framework and DB drivers load so auto-instrumentation can patch them.
const otel = startTelemetry({
  serviceName: config.OTEL_SERVICE_NAME,
  version: '0.0.1',
  endpoint: config.OTEL_EXPORTER_OTLP_ENDPOINT,
});

const [{ buildApp, APP_VERSION }, { createLogger }, { createMetrics }, { createDb }, { Redis }] =
  await Promise.all([
    import('./app.js'),
    import('./logger.js'),
    import('./metrics.js'),
    import('./db/client.js'),
    import('ioredis'),
  ]);

if (config.SENTRY_DSN) {
  const Sentry = await import('@sentry/node');
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    release: `parity-api@${APP_VERSION}`,
    sendDefaultPii: false,
  });
}

const logger = createLogger(config);
const metrics = createMetrics();
const { sql, close: closeDb } = createDb(config.DATABASE_URL);
const redis = new Redis(config.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});
await redis
  .connect()
  .catch((err: unknown) =>
    logger.warn({ err }, 'redis not reachable at boot; /readyz will report it'),
  );

const app = await buildApp({
  config,
  logger,
  metrics,
  health: {
    checkDb: async () => {
      await sql`SELECT 1`;
    },
    checkRedis: async () => {
      if (redis.status !== 'ready') await redis.connect();
      await redis.ping();
    },
  },
});

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'shutting down');
  await app.close();
  await Promise.allSettled([closeDb(), redis.quit(), otel.shutdown()]);
  process.exit(0);
};
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

await app.listen({ port: config.PORT, host: config.HOST });
logger.info({ port: config.PORT, env: config.NODE_ENV }, 'parity-api listening');
