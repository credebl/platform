import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { HEALTH_PROBED_SERVICES, IHealthPingResponse, healthPingPattern } from '@credebl/common/health/health-ping';
import { TtlCache } from '@credebl/common/utils/ttl-cache.util';
import { IHttpProbeResult, INatsProbeResult, IPlatformHealth, IServiceHealth } from './health.interface';

const PROBE_TIMEOUT_MS = 3000;
const CACHE_TTL_MS = 5000;

/**
 * Parses HEALTH_TARGETS, a comma-separated `service=baseUrl` list, e.g.
 * `user=http://user:8081,issuance=http://issuance.internal:8081`. Invalid entries are ignored.
 * Only these configured URLs are ever called, never anything taken from a request.
 */
export const parseHealthTargets = (raw = process.env.HEALTH_TARGETS): Record<string, string> => {
  const targets: Record<string, string> = {};
  for (const entry of (raw ?? '').split(',')) {
    const separator = entry.indexOf('=');
    if (0 >= separator) {
      continue;
    }
    const name = entry.slice(0, separator).trim();
    const url = entry.slice(separator + 1).trim();
    try {
      const { protocol } = new URL(url);
      if ('http:' === protocol || 'https:' === protocol) {
        targets[name] = url.replace(/\/+$/, '');
      }
    } catch {
      // ignore malformed URL
    }
  }
  return targets;
};

export const summarize = (services: Record<string, IServiceHealth>): IPlatformHealth['status'] => {
  const statuses = Object.values(services).flatMap(({ http, nats }) =>
    'not_configured' === http.status ? [nats.status] : [http.status, nats.status]
  );
  if (statuses.every((status) => 'up' === status)) {
    return 'ok';
  }
  return statuses.every((status) => 'down' === status) ? 'down' : 'degraded';
};

@Injectable()
export class HealthService {
  private readonly logger = new Logger('HealthService');
  private readonly cache = new TtlCache<IPlatformHealth>(CACHE_TTL_MS);
  private inFlight?: Promise<IPlatformHealth>;

  constructor(@Inject('NATS_CLIENT') private readonly natsClient: ClientProxy) {}

  /** Cached for 5s and shared between concurrent callers, so polling cannot fan out to every service. */
  async getPlatformHealth(): Promise<IPlatformHealth> {
    return this.cache.get(() => {
      this.inFlight ??= this.probeAll().finally(() => {
        this.inFlight = undefined;
      });
      return this.inFlight;
    });
  }

  private async probeAll(): Promise<IPlatformHealth> {
    const targets = parseHealthTargets();
    const entries = await Promise.all(
      HEALTH_PROBED_SERVICES.map(async (service): Promise<[string, IServiceHealth]> => {
        const [http, nats] = await Promise.all([this.probeHttp(targets[service]), this.probeNats(service)]);
        return [service, { http, nats }];
      })
    );
    const services = Object.fromEntries(entries);
    return { status: summarize(services), generatedAt: new Date().toISOString(), services };
  }

  async probeHttp(baseUrl?: string): Promise<IHttpProbeResult> {
    if (!baseUrl) {
      return { status: 'not_configured' };
    }
    const start = Date.now();
    try {
      const response = await fetch(`${baseUrl}/health/ready`, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
      const body = (await response.json().catch(() => ({}))) as { checks?: Record<string, string> };
      return {
        status: response.ok ? 'up' : 'down',
        latencyMs: Date.now() - start,
        checks: body.checks,
        ...(response.ok ? {} : { error: `HTTP ${response.status}` })
      };
    } catch (error) {
      return { status: 'down', error: (error as Error)?.message ?? 'unreachable' };
    }
  }

  async probeNats(service: string): Promise<INatsProbeResult> {
    const start = Date.now();
    try {
      const reply = await firstValueFrom(
        this.natsClient.send<IHealthPingResponse>(healthPingPattern(service), {}).pipe(timeout(PROBE_TIMEOUT_MS))
      );
      return {
        status: 'up',
        latencyMs: Date.now() - start,
        instanceId: reply?.instanceId,
        uptimeSeconds: reply?.uptimeSeconds
      };
    } catch (error) {
      this.logger.debug(`NATS health ping to ${service} failed: ${(error as Error)?.message}`);
      return { status: 'down', error: (error as Error)?.message ?? 'no response' };
    }
  }
}
