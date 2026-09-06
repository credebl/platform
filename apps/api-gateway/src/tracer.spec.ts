import { trace } from '@opentelemetry/api';

// Guards the NodeSDK bootstrap path in ./tracer. Kept intentionally offline
// (no OTLP server): the happy-path span export over a live endpoint is covered
// by tracer.integration.spec.ts. These tests pin the boot behaviour that a
// @opentelemetry/sdk-node upgrade could silently break under webpack bundling
// (see the tree-shaking review concern on #1729).
describe('tracer — NodeSDK bootstrap', () => {
  const pristineEnv = { ...process.env };
  let sdkUnderTest: (typeof import('./tracer'))['otelSDK'];

  afterEach(async () => {
    if (sdkUnderTest) {
      // Offline suite (no OTLP listener): shutting down may flush a pending
      // batch and reject with ECONNREFUSED. The successful export path is
      // covered by tracer.integration.spec.ts, so swallow it here.
      await sdkUnderTest.shutdown().catch(() => {});
      sdkUnderTest = null;
    }
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
      process.env.OTEL_TRACES_OTLP_ENDPOINT = 'http://127.0.0.1:4318';
      process.env.OTEL_LOGS_OTLP_ENDPOINT = 'http://127.0.0.1:4319';
      process.env.OTEL_HEADERS_KEY = 'unit-key';
      process.env.OTEL_LOGGER_NAME = 'unit-logger';
      process.env.HOSTNAME = 'unit-host';
    });

    it('boots NodeSDK, logger provider and exposes both', async () => {
      const tracerModule = await import('./tracer');

      expect(tracerModule.otelSDK).not.toBeNull();
      expect(tracerModule.otelLogger).not.toBeNull();
      expect(tracerModule.otelLoggerProviderInstance).not.toBeNull();
    });

    it('allows the SDK to start and shut down cleanly', async () => {
      const tracerModule = await import('./tracer');
      sdkUnderTest = tracerModule.otelSDK;

      expect(() => tracerModule.otelSDK?.start()).not.toThrow();
      await expect(tracerModule.otelSDK?.shutdown()).resolves.toBeUndefined();
    });

    it('returns a working tracer from the global API after start', async () => {
      const tracerModule = await import('./tracer');
      sdkUnderTest = tracerModule.otelSDK;
      await tracerModule.otelSDK?.start();

      const tracer = trace.getTracer('unit-test');
      const span = tracer.startSpan('unit-test-span');
      expect(span.isRecording()).toBe(true);
      span.end();
    });
  });
});
