import { execFileSync, type ExecFileSyncOptions } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const distEntry = join(process.cwd(), 'dist', 'apps', 'api-gateway', 'main.js');

// CI builds the webpack bundle in .github/workflows/test.yml, so the suite
// always runs there. It is only skipped for local `pnpm jest` runs that have
// not run `nest build api-gateway` first. The test guards the tree-shaking
// runtime failure that was flagged during review of the @opentelemetry/sdk-node
// upgrade: a successful webpack build is worthless if module evaluation breaks
// at boot.
const skipWithoutBundle = !existsSync(distEntry) && 'true' !== process.env.CI;
const describeBundle = skipWithoutBundle ? describe.skip : describe;

describeBundle('webpack production bundle — api-gateway', () => {
  const childEnv: NodeJS.ProcessEnv = {
    ...process.env,
    IS_ENABLE_OTEL: 'true',
    OTEL_SERVICE_NAME: 'bundle-smoke',
    OTEL_SERVICE_VERSION: '1.0.0',
    OTEL_SERVICE_INSTANCE_ID: 'smoke',
    OTEL_TRACES_OTLP_ENDPOINT: 'http://127.0.0.1:4317',
    OTEL_LOGS_OTLP_ENDPOINT: 'http://127.0.0.1:4317',
    OTEL_HEADERS_KEY: 'smoke-key',
    OTEL_LOGGER_NAME: 'smoke',
    NATS_URL: 'nats://127.0.0.1:4222',
    NATS_SERVERS: 'nats://127.0.0.1:4222',
    NATS_AUTH_TYPE: 'none'
  };

  const runBundle = (): string => {
    const script = [
      `try {`,
      `  require(${JSON.stringify(distEntry)});`,
      `  setTimeout(() => { console.log('BUNDLE_LOADED'); process.exit(0); }, 3000);`,
      `} catch (err) {`,
      `  console.error('LOAD_FAILED', err && err.message);`,
      `  process.exit(1);`,
      `}`
    ].join('\n');
    const options: ExecFileSyncOptions = { env: childEnv, encoding: 'utf8', timeout: 60_000 };
    return execFileSync(process.execPath, ['-e', script], options) as unknown as string;
  };

  it('completes module evaluation and boots the OpenTelemetry SDK', () => {
    const output = runBundle();
    expect(output).toContain('BUNDLE_LOADED');
    expect(output).toContain('OpenTelemetry SDK started successfully');
  });

  it('does not fail with sdk-trace-base tree-shaking errors', () => {
    try {
      runBundle();
    } catch (error) {
      const { message } = error as Error;
      expect(message).not.toMatch(/Class extends value undefined|Cannot find module|sdk-trace-base/);
    }
  });
});
