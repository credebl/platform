---
'api-gateway': patch
---

Restrict JWT issuer trust to `JWT_TRUSTED_ISSUERS` or the configured Keycloak realm, enforce passkey ownership, and prevent duplicate status-list allocations during concurrent issuance. Before deploying, configure a trusted issuer and resolve any duplicate status-list slots, active lists, or normalized passkey credential IDs flagged by the database migrations.
