import { createServer, type Server } from 'node:http';

import { trace } from '@opentelemetry/api';

// Guards the NodeSDK bootstrap path in ./tracer. Kept intentionally offline
// (no OTLP server): the happy-path span export over a live endpoint is covered
// by tracer.integration.spec.ts. These tests pin the boot behaviour that a
// @opentelemetry/sdk-node upgrade could silently break under webpack bundling
// (see the tree-shaking review concern on #1729).
describe('tracer — NodeSDK bootstrap', () => {
  const pristineEnv = { ...process.env };
  let sdkUnderTest: (typeof import('./tracer'))['otelSDK'];
  let loggerProviderUnderTest: (typeof import('./tracer'))['otelLoggerProviderInstance'];
  let otlpServer: Server;
  let otlpPort = 0;

  beforeEach(async () => {
    // A live 200-OK sink guarantees the SDK/LoggerProvider shutdown resolves
    // promptly even when a span/log was produced: the newer otlp exporter
    // retries refused connections, which would otherwise leave timers behind
    // and hang the jest exit (see #1750).
    otlpServer = createServer((_req, res) => {
      res.statusCode = 200;
      res.end();
    });
    await new Promise<void>((resolve) => otlpServer.listen(0, '127.0.0.1', resolve));
    const address = otlpServer.address();
    otlpPort = 'object' === typeof address ? address.port : 0;
  });

  afterEach(async () => {
    if (sdkUnderTest) {
      await Promise.race([
        sdkUnderTest.shutdown().catch(() => {}),
        new Promise<void>((resolve) => setTimeout(resolve, 3000))
      ]);
      sdkUnderTest = null;
    }
    if (loggerProviderUnderTest) {
      await Promise.race([
        loggerProviderUnderTest.shutdown().catch(() => {}),
        new Promise<void>((resolve) => setTimeout(resolve, 3000))
      ]);
      loggerProviderUnderTest = null;
    }
    await new Promise<void>((resolve) => otlpServer.close(() => resolve()));
    trace.disable();
    process.env = { ...pristineEnv };
    jest.resetModules();
  });

  describe('when IS_ENABLE_OTEL is not exactly "true"', () => {
    it.each(['false', '0', '', 'FALSE'])('does not initialize the SDK for "%s"', async (value) => {
      process.env.IS_ENABLE_OTEL = value;
      const tracerModule = await import('./tracer');

      expect(tracerModule.otelSDK).toBeNull();
      expect(tracerModule.otelLogger).toBeNull();
      expect(tracerModule.otelLoggerProviderInstance).toBeNull();
    });

    it('does not initialize the SDK when the variable is unset', async () => {
      delete process.env.IS_ENABLE_OTEL;
      const tracerModule = await import('./tracer');

      expect(tracerModule.otelSDK).toBeNull();
      expect(tracerModule.otelLogger).toBeNull();
      expect(tracerModule.otelLoggerProviderInstance).toBeNull();
    });
  });

  describe('when IS_ENABLE_OTEL=true', () => {
    beforeEach(() => {
      process.env.IS_ENABLE_OTEL = 'true';
      process.env.OTEL_SERVICE_NAME = 'unit-test';
      process.env.OTEL_SERVICE_VERSION = '1.0.0';
      process.env.OTEL_SERVICE_INSTANCE_ID = 'unit-instance';
      process.env.OTEL_TRACES_OTLP_ENDPOINT = `http://127.0.0.1:${otlpPort}`;
      process.env.OTEL_LOGS_OTLP_ENDPOINT = `http://127.0.0.1:${otlpPort}`;
      process.env.OTEL_HEADERS_KEY = 'unit-key';
      process.env.OTEL_LOGGER_NAME = 'unit-logger';
      process.env.HOSTNAME = 'unit-host';
    });

    it('boots NodeSDK, logger provider and exposes both', async () => {
      const tracerModule = await import('./tracer');
      loggerProviderUnderTest = tracerModule.otelLoggerProviderInstance;

      expect(tracerModule.otelSDK).not.toBeNull();
      expect(tracerModule.otelLogger).not.toBeNull();
      expect(tracerModule.otelLoggerProviderInstance).not.toBeNull();
    });

    it('allows the SDK to start and shut down cleanly', async () => {
      const tracerModule = await import('./tracer');
      sdkUnderTest = tracerModule.otelSDK;
      loggerProviderUnderTest = tracerModule.otelLoggerProviderInstance;

      expect(() => tracerModule.otelSDK?.start()).not.toThrow();
      await expect(tracerModule.otelSDK?.shutdown()).resolves.toBeUndefined();
      sdkUnderTest = null;
    });

    it('returns a working tracer from the global API after start', async () => {
      const tracerModule = await import('./tracer');
      sdkUnderTest = tracerModule.otelSDK;
      loggerProviderUnderTest = tracerModule.otelLoggerProviderInstance;
      await tracerModule.otelSDK?.start();

      const tracer = trace.getTracer('unit-test');
      const span = tracer.startSpan('unit-test-span');
      expect(span.isRecording()).toBe(true);
      span.end();
    });
  });
});
