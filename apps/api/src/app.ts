import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import type { Config } from './config.js';
import type { Logger } from './logger.js';
import type { Metrics } from './metrics.js';
import { healthRoutes, type HealthDeps } from './routes/health.js';
import { metaRoutes } from './routes/meta.js';

export const APP_VERSION = '0.0.1';

export type AppDeps = { config: Config; logger: Logger; metrics: Metrics; health: HealthDeps };

/** Build the Fastify instance with dependencies injected so tests can run it without a database. */
export async function buildApp(deps: AppDeps) {
  const app = Fastify({
    loggerInstance: deps.logger,
    disableRequestLogging: deps.config.NODE_ENV === 'test',
    trustProxy: true,
    bodyLimit: 256 * 1024, // screenshots never go through the API; they go to object storage via pre-signed URLs
  });
  await app.register(helmet, { global: true });

  app.addHook('onResponse', (req, reply, done) => {
    const route = req.routeOptions.url ?? 'unmatched';
    deps.metrics.httpRequestDuration.observe(
      { method: req.method, route, status: String(reply.statusCode) },
      reply.elapsedTime / 1000,
    );
    done();
  });

  app.get('/metrics', async (_req, reply) => {
    reply.header('content-type', deps.metrics.registry.contentType);
    return deps.metrics.registry.metrics();
  });

  await app.register(healthRoutes, { deps: deps.health });
  await app.register(metaRoutes, { config: deps.config, version: APP_VERSION });
  return app;
}
