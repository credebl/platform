export type ProbeStatus = 'up' | 'down' | 'not_configured';

export interface IHttpProbeResult {
  status: ProbeStatus;
  latencyMs?: number;
  /** Per-dependency status reported by the service's /health/ready (nats, database, redis). */
  checks?: Record<string, string>;
  error?: string;
}

export interface INatsProbeResult {
  status: 'up' | 'down';
  latencyMs?: number;
  instanceId?: string;
  uptimeSeconds?: number;
  error?: string;
}

export interface IServiceHealth {
  http: IHttpProbeResult;
  nats: INatsProbeResult;
}

export interface IPlatformHealth {
  status: 'ok' | 'degraded' | 'down';
  generatedAt: string;
  services: Record<string, IServiceHealth>;
}
