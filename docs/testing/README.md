# Testing Guide

## Smoke Test (Throwaway)
Quick verification of build + basic service communication for OID4VC subset.

```bash
# OID4VC subset (default)
RUN_INTEGRATION=true ./scripts/smoke-throwaway.sh

# Core subset
SUBSET=core RUN_INTEGRATION=true ./scripts/smoke-throwaway.sh

# All apps
SUBSET=all RUN_INTEGRATION=true ./scripts/smoke-throwaway.sh
```

Behavior: spins up throwaway Postgres/NATS/Redis, builds selected apps, boots them briefly, tears down. Skips in CI unless RUN_INTEGRATION=true.

## Integration Test (Full)
Runs OID4VC subset with real infra and integration/e2e tests.

```bash
# Setup infra + migrate
RUN_INTEGRATION=true ./scripts/integration-setup.sh

# Start services + run integration tests
RUN_INTEGRATION=true ./scripts/integration-run.sh
```

Notes:
- Requires Docker for Postgres/NATS/Redis. Keycloak/Agent-Controller may be needed depending on flows.
- Configure via `.env.integration` (copy from `.env.integration.example`).
- Jest config: `jest.integration.config.js` runs `*.integration.spec.ts` and `*.e2e-spec.ts`.
- Gating: Integration/e2e skipped in CI by default; set `RUN_INTEGRATION=true` only when explicitly running integration.

## Unit Tests
Use existing `jest.ci.config.js` in standard workflows (no external infra required).
