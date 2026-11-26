---
'api-gateway': minor
---

Add `GET /platform/health` (platform admin only): an aggregated status of every microservice that combines each service's `/health/ready` probe (configured with the new `HEALTH_TARGETS` env var, a comma-separated `service=baseUrl` list) with a NATS ping through the service's message handler. Cached for 5 seconds. Every microservice now answers the NATS health ping.
