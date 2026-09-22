import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';
import { loadConfig } from '../../src/config.js';
import { createLogger } from '../../src/logger.js';
import { createMetrics } from '../../src/metrics.js';

const config = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'fatal' });
let dbOk = true;
let redisOk = true;
const app = await buildApp({
  config,
  logger: createLogger(config),
  metrics: createMetrics(),
  health: {
    checkDb: async () => {
      if (!dbOk) throw new Error('db down');
    },
    checkRedis: async () => {
      if (!redisOk) throw new Error('redis down');
    },
  },
});

describe('app', () => {
  beforeAll(() => app.ready());
  afterAll(() => app.close());

  it('reports liveness', async () => {
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });
  it('reports readiness and degrades to 503 when a dependency fails', async () => {
    expect((await app.inject({ method: 'GET', url: '/readyz' })).statusCode).toBe(200);
    redisOk = false;
    const res = await app.inject({ method: 'GET', url: '/readyz' });
    expect(res.statusCode).toBe(503);
    expect(res.json().checks).toEqual({ db: 'ok', redis: 'fail' });
    redisOk = true;
    dbOk = false;
    expect((await app.inject({ method: 'GET', url: '/readyz' })).json().checks).toEqual({
      db: 'fail',
      redis: 'ok',
    });
    dbOk = true;
  });
  it('exposes prometheus metrics including request latency', async () => {
    await app.inject({ method: 'GET', url: '/healthz' });
    const res = await app.inject({ method: 'GET', url: '/metrics' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('http_request_duration_seconds');
  });
  it('states the non-negotiable principles in /v1/meta', async () => {
    const body = (await app.inject({ method: 'GET', url: '/v1/meta' })).json();
    expect(body.principles).toEqual({
      affiliate_revenue: false,
      sells_individual_data: false,
      account_required_for_check: false,
      k_anonymity_min: 10,
    });
    expect(body.metros.map((m: { code: string }) => m.code)).toEqual(['HOU', 'DFW', 'AUS', 'SAT']);
    expect(body.bot_user_agent).toMatch(
      /^ParityPriceCheck\/\d+\.\d+\.\d+ \(\+https?:\/\/.+; mailto:.+\)$/,
    );
  });
  it('sets security headers', async () => {
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
