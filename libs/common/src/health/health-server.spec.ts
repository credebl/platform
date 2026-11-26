import { AddressInfo } from 'node:net';
import { Server } from 'node:http';
import { createHealthRequestHandler, prismaCheck, runChecks, startHealthServer } from './health-server';
import { createServer } from 'node:http';

const listen = (checks: Record<string, () => Promise<void>>): Promise<{ server: Server; url: string }> =>
  new Promise((resolve) => {
    const handler = createHealthRequestHandler({ serviceName: 'test-service', checks });
    const server = createServer((req, res) => void handler(req, res));
    server.listen(0, '127.0.0.1', () =>
      resolve({ server, url: `http://127.0.0.1:${(server.address() as AddressInfo).port}` })
    );
  });

describe('health server', () => {
  let server: Server;
  afterEach(() => new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve())));

  it('GET /health/live returns 200 without running checks', async () => {
    const check = jest.fn().mockRejectedValue(new Error('down'));
    const started = await listen({ database: check });
    ({ server } = started);
    const res = await fetch(`${started.url}/health/live`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', service: 'test-service' });
    expect(check).not.toHaveBeenCalled();
  });

  it('GET /health/ready returns 200 when every check passes', async () => {
    const started = await listen({ database: async () => undefined, nats: async () => undefined });
    ({ server } = started);
    const res = await fetch(`${started.url}/health/ready`);
    expect(res.status).toBe(200);
    expect((await res.json()).checks).toEqual({ database: 'up', nats: 'up' });
  });

  it('GET /health/ready returns 503 when a dependency is unreachable', async () => {
    const started = await listen({
      database: async () => undefined,
      nats: () => Promise.reject(new Error('connection refused'))
    });
    ({ server } = started);
    const res = await fetch(`${started.url}/health/ready`);
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ status: 'unavailable', checks: { database: 'up', nats: 'down' } });
  });

  it('returns 404 for unknown paths and 405 for non-GET methods', async () => {
    const started = await listen({});
    ({ server } = started);
    expect((await fetch(`${started.url}/nope`)).status).toBe(404);
    expect((await fetch(`${started.url}/health/live`, { method: 'POST' })).status).toBe(405);
  });

  it('tolerates a trailing slash and query string', async () => {
    const started = await listen({});
    ({ server } = started);
    expect((await fetch(`${started.url}/health/live/?x=1`)).status).toBe(200);
  });
});

describe('runChecks', () => {
  it('marks a check that hangs as down once it times out', async () => {
    jest.useFakeTimers();
    const pending = runChecks({ slow: () => new Promise<void>(() => undefined) });
    await jest.advanceTimersByTimeAsync(3001);
    await expect(pending).resolves.toEqual({ ready: false, checks: { slow: 'down' } });
    jest.useRealTimers();
  });

  it('is ready with no checks', async () => {
    await expect(runChecks({})).resolves.toEqual({ ready: true, checks: {} });
  });
});

describe('prismaCheck', () => {
  it('rejects when the query fails and resolves otherwise', async () => {
    const $queryRaw = jest
      .fn()
      .mockResolvedValueOnce([{ '?column?': 1 }])
      .mockRejectedValueOnce(new Error('db down'));
    await expect(prismaCheck({ $queryRaw })()).resolves.toBeUndefined();
    await expect(prismaCheck({ $queryRaw })()).rejects.toThrow('db down');
  });
});

describe('startHealthServer', () => {
  const original = process.env.HEALTH_PORT;
  afterEach(() => {
    process.env.HEALTH_PORT = original;
    if (undefined === original) {
      delete process.env.HEALTH_PORT;
    }
  });

  it('is disabled when HEALTH_PORT is not set', () => {
    delete process.env.HEALTH_PORT;
    expect(startHealthServer({ serviceName: 'svc' })).toBeUndefined();
  });

  it('is disabled for an invalid HEALTH_PORT', () => {
    expect(startHealthServer({ serviceName: 'svc', port: 'abc' })).toBeUndefined();
    expect(startHealthServer({ serviceName: 'svc', port: 70000 })).toBeUndefined();
  });

  it('listens when HEALTH_PORT is set', async () => {
    const server = startHealthServer({ serviceName: 'svc', port: 0 }) as Server;
    await new Promise((resolve) => server.once('listening', resolve));
    const res = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/health/live`);
    expect(res.status).toBe(200);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
