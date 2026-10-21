# Integration Testing (OID4VC focus)

## Overview
- Smoke (throwaway): builds and boots minimal OID4VC subset (oid4vc-issuance, oid4vc-verification, api-gateway) against local infra.
- Full integration: boots subset + required deps with real infra (Postgres/NATS/Redis) and runs integration/e2e tests.

## Gating
- Integration/e2e run only when `RUN_INTEGRATION=true`. In CI (`CI=true`) with `RUN_INTEGRATION!=true`, scripts/CI skip by default.
- Unit tests remain in `jest.ci.config.js`. Integration tests use `jest.integration.config.js` (matches `*.integration.spec.ts` and `*.e2e-spec.ts`).

## Quick start
```bash
# smoke (OID4VC)
RUN_INTEGRATION=true ./scripts/smoke-throwaway.sh  # or SUBSET=oid4vc

# integration setup
RUN_INTEGRATION=true ./scripts/integration-setup.sh
# integration run
RUN_INTEGRATION=true ./scripts/integration-run.sh
```

## Env
Copy `.env.integration.example` to `.env.integration` and adjust (Keycloak/Agent-Controller).

Database connection: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER` and
`POSTGRES_PASSWORD` are the supported configuration — `DATABASE_URL` and `POOL_DATABASE_URL`
are derived from them (credentials percent-encoded) by both the setup and run scripts.
Set `POSTGRES_*` rather than the URLs; an explicit shell `DATABASE_URL`/`POOL_DATABASE_URL`
that disagrees with `POSTGRES_*` is rejected with an error.

## Notes
- Focus: OID4VC issuance/verification flows via api-gateway and agent-controller integration.
- The integration-testing changes in this area are limited to test infrastructure, scripts and documentation.
