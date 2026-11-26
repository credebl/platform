---
'api-gateway': minor
---

NATS microservices can now expose `GET /health/live` and `GET /health/ready` on a separate HTTP port. Set `HEALTH_PORT` on a service to enable it; it is off by default. `/health/ready` returns 503 when the database, NATS or (for issuance and notification) Redis is unreachable.
