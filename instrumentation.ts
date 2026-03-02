import { registerOTel } from '@vercel/otel';

/**
 * OpenTelemetry instrumentation for Kubiks observability platform
 * 
 * Environment variables required:
 * - OTEL_EXPORTER_OTLP_ENDPOINT: https://ingest.kubiks.app
 * - OTEL_EXPORTER_OTLP_PROTOCOL: http/protobuf
 * - OTEL_EXPORTER_OTLP_HEADERS: x-kubiks-key=<your-api-key>
 * - OTEL_SERVICE_NAME: chasebank
 * 
 * See .env.example for configuration template
 */
export function register() {
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || 'chasebank',
  });
}
