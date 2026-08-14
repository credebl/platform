import { createServer, Server } from 'node:http';

import { trace } from '@opentelemetry/api';

describe('tracer — OpenTelemetry sdk-node integration', () => {
  const pristineEnv = { ...process.env };
  let otlpServer: Server;
  let otlpPort: number;
  const receivedBodies: Buffer[] = [];

  beforeEach(async () => {
    receivedBodies.length = 0;
    otlpServer = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      req.on('end', () => {
        receivedBodies.push(Buffer.concat(chunks));
        res.statusCode = 200;
        res.end();
      });
    });
    await new Promise<void>((resolve) => otlpServer.listen(0, '127.0.0.1', resolve));
    const address = otlpServer.address();
    otlpPort = 'object' === typeof address ? address.port : 0;

    process.env.IS_ENABLE_OTEL = 'true';
    process.env.OTEL_SERVICE_NAME = 'integration-test';
    process.env.OTEL_SERVICE_VERSION = '1.0.0';
    process.env.OTEL_TRACES_OTLP_ENDPOINT = `http://127.0.0.1:${otlpPort}`;
    process.env.OTEL_LOGS_OTLP_ENDPOINT = `http://127.0.0.1:${otlpPort}`;
    process.env.OTEL_HEADERS_KEY = 'test-api-key';
    process.env.OTEL_BLRP_SCHEDULE_DELAY = '100';
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => otlpServer.close(() => resolve()));
    process.env = { ...pristineEnv };
  });

  it('boots the sdk-node tracer and exports a span over OTLP', async () => {
    jest.resetModules();
    const tracerModule = await import('./tracer');

    expect(tracerModule.otelSDK).not.toBeNull();
    expect(tracerModule.otelLogger).not.toBeNull();

    await tracerModule.otelSDK?.start();
    const tracer = trace.getTracer('integration-test');
    const span = tracer.startSpan('test-span');
    span.end();
    await tracerModule.otelSDK?.shutdown();

    await new Promise<void>((resolve) => setTimeout(resolve, 250));
    expect(receivedBodies.length).toBeGreaterThan(0);
    expect(receivedBodies.some((body) => 0 < body.length)).toBe(true);
  });
});
