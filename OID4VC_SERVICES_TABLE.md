| Service | Purpose | Status (when started) | Notes |
|---|---|---|---|
| oid4vc-issuance | OID4VC issuance microservice | Started (listening to NATS) | DB schema required; uses NATS/Redis/Postgres |
| oid4vc-verification | OID4VC verification microservice | Started (listening to NATS) | DB schema required; uses NATS/Redis/Postgres |
| api-gateway | REST/API gateway | Started (connected to NATS, app started) | Exposed on http://localhost:5000; Keycloak creds missing causes config warnings |
