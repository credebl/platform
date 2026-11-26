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

## Platform health aggregator (api-gateway)

`GET /platform/health` on the API gateway (platform admin only) combines two independent probes per service, so the admin status page needs just one call. The response is cached for 5 seconds and concurrent requests share one probe run.

```json
{
  "status": "degraded",
  "generatedAt": "2026-01-01T00:00:00.000Z",
  "services": {
    "user": {
      "http": { "status": "up", "latencyMs": 12, "checks": { "nats": "up", "database": "up" } },
      "nats": { "status": "up", "latencyMs": 4, "instanceId": "user-7d9f", "uptimeSeconds": 3600 }
    }
  }
}
```

- **`http`**: the gateway calls `<base-url>/health/ready` of each service. The base URLs come from `HEALTH_TARGETS` on the gateway, so it works on any platform (Docker DNS, Kubernetes, ECS service discovery, Consul, plain IPs):

  ```bash
  HEALTH_TARGETS=user=http://user:8081,issuance=http://issuance:8081,organization=http://organization:8081
  ```

  Services that are not listed show `not_configured` and do not affect the overall status. Only these configured URLs are called; nothing is taken from a request.

- **`nats`**: a ping sent over NATS to the service's own message handler (`health-check-<service>`). A reply proves the service is subscribed and handling messages, and that the gateway-to-service path works. A stopped service has no subscriber, so NATS answers "no responders" immediately. With several replicas, a ping reaches one of them (`instanceId` says which).
- **Overall `status`**: `ok` when all configured probes are up, `down` when all are down, otherwise `degraded`. If every service reads down at once, suspect NATS or the network rather than the services.

Each service answers the ping through `HealthPingModule.register(CommonConstants.<SERVICE>)` in its module `imports`.
