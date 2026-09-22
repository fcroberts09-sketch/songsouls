import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

/** Prometheus registry. Dashboards from day one: ingestion rate, integrity outcomes, card latency, queue depth. */
export function createMetrics() {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry });
  return {
    registry,
    httpRequestDuration: new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request latency',
      labelNames: ['method', 'route', 'status'] as const,
      buckets: [0.01, 0.025, 0.05, 0.1, 0.2, 0.3, 0.5, 1, 2, 5],
      registers: [registry],
    }),
    observationsIngested: new Counter({
      name: 'observations_ingested_total',
      help: 'Observations accepted for processing',
      labelNames: ['retailer', 'capture_method', 'synthetic'] as const,
      registers: [registry],
    }),
    integrityOutcomes: new Counter({
      name: 'integrity_outcomes_total',
      help: 'Integrity scoring outcomes',
      labelNames: ['status'] as const,
      registers: [registry],
    }),
    queueDepth: new Gauge({
      name: 'queue_depth',
      help: 'Jobs waiting per queue',
      labelNames: ['queue'] as const,
      registers: [registry],
    }),
  };
}
export type Metrics = ReturnType<typeof createMetrics>;
