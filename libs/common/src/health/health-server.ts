import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';
import { connect as netConnect } from 'node:net';
import { INestMicroservice, Logger } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
import { connect as natsConnect, ConnectionOptions, NatsConnection } from 'nats';

export type HealthCheck = () => Promise<void>;

export interface IHealthServerOptions {
  serviceName: string;
  /** Port to listen on. Defaults to process.env.HEALTH_PORT; the listener is disabled when neither is set. */
  port?: number | string;
  /** Named readiness checks. Each must resolve when the dependency is reachable and reject otherwise. */
  checks?: Record<string, HealthCheck>;
}

const CHECK_TIMEOUT_MS = 3000;
const logger = new Logger('HealthServer');

const withTimeout = async (name: string, check: HealthCheck): Promise<void> => {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${name} check timed out after ${CHECK_TIMEOUT_MS}ms`)),
      CHECK_TIMEOUT_MS
    );
  });
  try {
    await Promise.race([check(), timeout]);
  } finally {
    clearTimeout(timer);
  }
};

export const runChecks = async (
  checks: Record<string, HealthCheck>
): Promise<{ ready: boolean; checks: Record<string, 'up' | 'down'> }> => {
  const entries = await Promise.all(
    Object.entries(checks).map(async ([name, check]): Promise<[string, 'up' | 'down']> => {
      try {
        await withTimeout(name, check);
        return [name, 'up'];
      } catch (error) {
        logger.warn(`Readiness check "${name}" failed: ${(error as Error)?.message}`);
        return [name, 'down'];
      }
    })
  );
  const result = Object.fromEntries(entries);
  return { ready: entries.every(([, status]) => 'up' === status), checks: result };
};

/** Database check: runs `SELECT 1` through any Prisma client. */
export const prismaCheck =
  (prisma: { $queryRaw: (query: TemplateStringsArray) => Promise<unknown> }): HealthCheck =>
  async () => {
    await prisma.$queryRaw`SELECT 1`;
  };

/**
 * NATS check: keeps one dedicated connection (same credentials as the service) and flushes on it,
 * so a reply from the server proves the broker is reachable and the credentials are accepted.
 */
export const natsCheck = (options: ConnectionOptions): HealthCheck => {
  let connection: NatsConnection | undefined;
  return async () => {
    if (!connection || connection.isClosed()) {
      connection = await natsConnect({ ...options, name: 'health-check' });
    }
    await connection.flush();
  };
};

/** Redis check: TCP reachability of REDIS_HOST:REDIS_PORT. */
export const redisCheck =
  (host = process.env.REDIS_HOST, port = Number(process.env.REDIS_PORT) || 6379): HealthCheck =>
  () =>
    new Promise<void>((resolve, reject) => {
      if (!host) {
        reject(new Error('REDIS_HOST is not set'));
        return;
      }
      const socket = netConnect({ host, port });
      socket.setTimeout(CHECK_TIMEOUT_MS);
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('timeout', () => {
        socket.destroy();
        reject(new Error('Redis connection timed out'));
      });
      socket.once('error', (error) => {
        socket.destroy();
        reject(error);
      });
    });

const send = (res: ServerResponse, status: number, body: unknown): void => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

export const createHealthRequestHandler =
  ({ serviceName, checks = {} }: Pick<IHealthServerOptions, 'serviceName' | 'checks'>) =>
  async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const path = (req.url ?? '').split('?')[0].replace(/\/+$/, '');
    if ('GET' !== req.method && 'HEAD' !== req.method) {
      send(res, 405, { status: 'error', message: 'Method not allowed' });
      return;
    }
    if ('/health/live' === path) {
      send(res, 200, { status: 'ok', service: serviceName });
      return;
    }
    if ('/health/ready' === path) {
      const { ready, checks: results } = await runChecks(checks);
      send(res, ready ? 200 : 503, { status: ready ? 'ok' : 'unavailable', service: serviceName, checks: results });
      return;
    }
    send(res, 404, { status: 'error', message: 'Not found' });
  };

/**
 * Starts the optional health listener of a NATS microservice.
 * Disabled (returns undefined) unless HEALTH_PORT is set. Failing to bind never stops the service.
 */
export const startHealthServer = (options: IHealthServerOptions): Server | undefined => {
  const rawPort = options.port ?? process.env.HEALTH_PORT;
  if (undefined === rawPort || '' === String(rawPort).trim()) {
    return undefined;
  }
  const port = Number(rawPort);
  if (!Number.isInteger(port) || 0 > port || 65535 < port) {
    logger.warn(`Invalid HEALTH_PORT "${rawPort}" for ${options.serviceName}; health endpoints are disabled`);
    return undefined;
  }

  const handler = createHealthRequestHandler(options);
  const server = createServer((req, res) => {
    handler(req, res).catch((error) => {
      logger.error(`Health request failed: ${(error as Error)?.message}`);
      if (!res.headersSent) {
        send(res, 500, { status: 'error' });
      }
    });
  });
  server.on('error', (error) => logger.error(`Health server for ${options.serviceName} failed: ${error.message}`));
  server.listen(port, () =>
    logger.log(`${options.serviceName} health endpoints on :${port} (/health/live, /health/ready)`)
  );
  return server;
};

/**
 * Wires the standard checks for a microservice: NATS always, the database when the service provides
 * PrismaService, and Redis when `redis` is set. Call after `app.listen()`.
 */
export const startMicroserviceHealth = (
  app: INestMicroservice,
  serviceName: string,
  natsOptions: ConnectionOptions,
  { redis = false }: { redis?: boolean } = {}
): Server | undefined => {
  if (!process.env.HEALTH_PORT) {
    return undefined;
  }
  const checks: Record<string, HealthCheck> = { nats: natsCheck(natsOptions) };
  try {
    checks.database = prismaCheck(app.get(PrismaService, { strict: false }));
  } catch {
    // service has no database
  }
  if (redis) {
    checks.redis = redisCheck();
  }
  return startHealthServer({ serviceName, checks });
};
