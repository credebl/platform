import { ClientProxy } from '@nestjs/microservices';
import { of, throwError, NEVER } from 'rxjs';
import { HEALTH_PROBED_SERVICES, healthPingPattern } from '@credebl/common/health/health-ping';
import { HealthService, parseHealthTargets, summarize } from './health.service';
import { IServiceHealth } from './health.interface';

describe('parseHealthTargets', () => {
  it('parses service=url pairs, trims and drops trailing slashes', () => {
    expect(parseHealthTargets(' user = http://user:8081/ , issuance=https://iss.internal:8081 ')).toEqual({
      user: 'http://user:8081',
      issuance: 'https://iss.internal:8081'
    });
  });

  it('ignores malformed entries and non-http URLs', () => {
    expect(parseHealthTargets('nourl,=http://x,user=notaurl,file=file:///etc/passwd,ok=http://ok:1')).toEqual({
      ok: 'http://ok:1'
    });
  });

  it('returns an empty map when unset', () => {
    expect(parseHealthTargets(undefined)).toEqual({});
  });
});

describe('summarize', () => {
  const svc = (http: IServiceHealth['http']['status'], nats: IServiceHealth['nats']['status']): IServiceHealth => ({
    http: { status: http },
    nats: { status: nats }
  });

  it('is ok when every configured probe is up (not_configured is ignored)', () => {
    expect(summarize({ a: svc('up', 'up'), b: svc('not_configured', 'up') })).toBe('ok');
  });

  it('is degraded when only some probes are down', () => {
    expect(summarize({ a: svc('up', 'up'), b: svc('down', 'up') })).toBe('degraded');
  });

  it('is down when every probe is down', () => {
    expect(summarize({ a: svc('down', 'down'), b: svc('not_configured', 'down') })).toBe('down');
  });
});

describe('HealthService', () => {
  const send = jest.fn();
  const client = { send } as unknown as ClientProxy;
  let service: HealthService;
  const originalFetch = global.fetch;
  const originalTargets = process.env.HEALTH_TARGETS;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HealthService(client);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (undefined === originalTargets) {
      delete process.env.HEALTH_TARGETS;
    } else {
      process.env.HEALTH_TARGETS = originalTargets;
    }
  });

  it('probeNats uses a per-service pattern and reports the replying instance', async () => {
    send.mockReturnValue(of({ service: 'user', instanceId: 'pod-1', uptimeSeconds: 42 }));
    const result = await service.probeNats('user');
    expect(send).toHaveBeenCalledWith(healthPingPattern('user'), {});
    expect(result).toMatchObject({ status: 'up', instanceId: 'pod-1', uptimeSeconds: 42 });
  });

  it('probeNats reports down on no responders', async () => {
    send.mockReturnValue(throwError(() => new Error('NO_RESPONDERS')));
    await expect(service.probeNats('user')).resolves.toEqual({ status: 'down', error: 'NO_RESPONDERS' });
  });

  it('probeNats times out when nothing replies', async () => {
    jest.useFakeTimers();
    send.mockReturnValue(NEVER);
    const pending = service.probeNats('user');
    await jest.advanceTimersByTimeAsync(3001);
    await expect(pending).resolves.toMatchObject({ status: 'down' });
    jest.useRealTimers();
  });

  it('probeHttp is not_configured without a target', async () => {
    await expect(service.probeHttp(undefined)).resolves.toEqual({ status: 'not_configured' });
  });

  it('probeHttp returns up with the dependency checks on 200', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ checks: { nats: 'up', database: 'up' } })
    });
    const result = await service.probeHttp('http://user:8081');
    expect(global.fetch).toHaveBeenCalledWith('http://user:8081/health/ready', expect.any(Object));
    expect(result).toMatchObject({ status: 'up', checks: { nats: 'up', database: 'up' } });
  });

  it('probeHttp returns down with the failed checks on 503', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ checks: { database: 'down' } })
    });
    await expect(service.probeHttp('http://user:8081')).resolves.toMatchObject({
      status: 'down',
      error: 'HTTP 503',
      checks: { database: 'down' }
    });
  });

  it('probeHttp returns down when the service is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(service.probeHttp('http://user:8081')).resolves.toEqual({ status: 'down', error: 'ECONNREFUSED' });
  });

  it('getPlatformHealth aggregates all services and caches the result for concurrent and repeat calls', async () => {
    process.env.HEALTH_TARGETS = 'user=http://user:8081';
    send.mockReturnValue(of({ service: 'x', instanceId: 'i', uptimeSeconds: 1 }));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ checks: {} }) });

    const [first, second] = await Promise.all([service.getPlatformHealth(), service.getPlatformHealth()]);
    await service.getPlatformHealth();

    expect(first).toBe(second);
    expect(Object.keys(first.services)).toEqual(HEALTH_PROBED_SERVICES);
    expect(first.status).toBe('ok');
    expect(send).toHaveBeenCalledTimes(HEALTH_PROBED_SERVICES.length);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
