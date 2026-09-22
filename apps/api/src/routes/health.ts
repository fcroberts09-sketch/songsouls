import type { FastifyPluginAsync } from 'fastify';

export type HealthDeps = {
  checkDb: () => Promise<void>;
  checkRedis: () => Promise<void>;
};

/** /healthz answers if the process is alive. /readyz answers only if Postgres and Redis answer. */
export const healthRoutes: FastifyPluginAsync<{ deps: HealthDeps }> = async (app, { deps }) => {
  app.get('/healthz', async () => ({ status: 'ok' }));

  app.get('/readyz', async (_req, reply) => {
    const checks: Record<string, 'ok' | 'fail'> = { db: 'ok', redis: 'ok' };
    const timed = (p: Promise<void>) =>
      Promise.race([
        p,
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 2000)),
      ]);
    const [db, redis] = await Promise.allSettled([timed(deps.checkDb()), timed(deps.checkRedis())]);
    if (db.status === 'rejected') checks.db = 'fail';
    if (redis.status === 'rejected') checks.redis = 'fail';
    const ready = Object.values(checks).every((v) => v === 'ok');
    reply.code(ready ? 200 : 503);
    return { status: ready ? 'ready' : 'not_ready', checks };
  });
};
