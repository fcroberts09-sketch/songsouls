/**
 * OpenTelemetry bootstrap. Import this module before anything else in the process entry point.
 * Traces export over OTLP/HTTP only when OTEL_EXPORTER_OTLP_ENDPOINT is set; otherwise the SDK
 * runs with no exporter, which keeps local development quiet at zero cost.
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

export function startTelemetry(opts: { serviceName: string; version: string; endpoint?: string }) {
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: opts.serviceName,
      [ATTR_SERVICE_VERSION]: opts.version,
    }),
    traceExporter: opts.endpoint
      ? new OTLPTraceExporter({ url: `${opts.endpoint}/v1/traces` })
      : undefined,
    instrumentations: [
      getNodeAutoInstrumentations({
        // fs instrumentation is noisy and useless for an HTTP API
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });
  sdk.start();
  return sdk;
}
