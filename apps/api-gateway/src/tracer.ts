// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck TODO: Facing issues with types, need to fix later
// tracer.ts
import * as dotenv from 'dotenv';
import * as process from 'process';

import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';

import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import type { Logger } from '@opentelemetry/api-logs';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { resourceFromAttributes } from '@opentelemetry/resources';

dotenv.config();

let otelSDK: NodeSDK | null = null;
let otelLogger: Logger | null = null;
let otelLoggerProviderInstance: LoggerProvider | null = null;
if ('true' === process.env.IS_ENABLE_OTEL) {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

  const resource = resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME,
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.OTEL_SERVICE_VERSION,
    [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: process.env.HOSTNAME
  });

  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_TRACES_OTLP_ENDPOINT,
    headers: {
      Authorization: `Api-Key ${process.env.OTEL_HEADERS_KEY}`
    }
  });

  const logExporter = new OTLPLogExporter({
    url: process.env.OTEL_LOGS_OTLP_ENDPOINT,
    headers: {
      Authorization: `Api-Key ${process.env.OTEL_HEADERS_KEY}`
    }
  });

  const logProvider = new LoggerProvider({ resource });
  logProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));
  otelLogger = logProvider.getLogger(process.env.OTEL_LOGGER_NAME);
  otelLoggerProviderInstance = logProvider;

  otelSDK = new NodeSDK({
    traceExporter,
    resource,
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation(), new NestInstrumentation()]
  });

  process.on('SIGTERM', () => {
    Promise.all([otelSDK!.shutdown(), logProvider.shutdown()])
      // eslint-disable-next-line no-console
      .then(() => console.log('SDK and Logger shut down successfully'))
      // eslint-disable-next-line no-console
      .catch((err) => console.log('Error during shutdown', err))
      .finally(() => process.exit(0));
  });
}

export { otelSDK, otelLogger, otelLoggerProviderInstance };
