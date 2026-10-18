## Test Results

- **Audit (pnpm audit)**: 70 → 3 advisories (down from 3 critical / 27 high / 33 moderate / 5 low to 0 critical / 0 high / 2 moderate / 1 low). Remaining 3 are documented accepted risks (aws-sdk v2 EOL, uuid ESM-blocked, braces no upstream fix / dev-only).
- **Jest (CI config)**: 19/19 suites, 233/233 tests — PASS (3 fewer tests than baseline are the dependency-integrity cases for removed packages; self-removing and verified).
- **Full 18-app boot smoke**: 18/18 BUILD_OK, 18/18 PASS. All apps reached Nest/NATS startup markers; API Gateway HTTP stack verified on alternate port (302/working). No `Cannot find module` errors.
- **Integration (with agent-controller)**: Platform services (agent-provisioning, agent-service, api-gateway) boot cleanly against fresh `credebl` DB + local NATS/Redis. Agent Controller Admin API (4001) reachable; base-wallet token + tenant creation + tenant token flow validated. Core endpoints (DIDs, OOB, connections, credentials, proofs, issuers) reachable; observed 401/404s on specific list endpoints are due to controller-local auth/tenant wiring, not remediation changes.
- **PR CI**: #1782 (Jest pass), #1784 (Jest pass), #1785 (Jest pass). #1772 CLOSED (green).

