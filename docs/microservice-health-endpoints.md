# Microservice health endpoints

Only `api-gateway` serves HTTP. Every other service is a NATS microservice, so orchestrators and uptime monitors
cannot probe it. Each microservice can now start a small optional HTTP listener, implemented once in
`libs/common/src/health/health-server.ts`.

## Enable

Set `HEALTH_PORT` for the service (off by default; an invalid value disables it with a warning):

```
HEALTH_PORT=8081
```

Give each service of a host its own port when they share a network namespace.

## Endpoints

| Endpoint            | Meaning                                       | Status                               |
| ------------------- | --------------------------------------------- | ------------------------------------ |
| `GET /health/live`  | The process is up. Runs no dependency checks. | `200`                                |
| `GET /health/ready` | Dependencies are reachable.                   | `200`, or `503` if any check is down |

`/health/ready` responds with the per-check status:

```json
{ "status": "unavailable", "service": "user", "checks": { "nats": "up", "database": "down" } }
```

Checks (each times out after 3 s):

- `nats`: a dedicated connection with the service's own credentials, flushed on each probe.
- `database`: `SELECT 1` through the service's `PrismaService` (skipped for services without a database).
- `redis`: TCP connect to `REDIS_HOST:REDIS_PORT` (issuance and notification only).

## Use in a service

```ts
const natsOptions = getNatsOptions(
  CommonConstants.USER_SERVICE,
  process.env.USER_NKEY_SEED,
  process.env.NATS_CREDS_FILE
);
const app = await NestFactory.createMicroservice(UserModule, { transport: Transport.NATS, options: natsOptions });
await app.listen();
startMicroserviceHealth(app, CommonConstants.USER_SERVICE, natsOptions); // add { redis: true } if the service uses Redis
```

Docker example: `healthcheck: { test: ["CMD", "wget", "-qO-", "http://localhost:8081/health/ready"] }`.

Prometheus-format metrics are not included yet.
