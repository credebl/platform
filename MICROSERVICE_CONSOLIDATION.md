# Microservice Consolidation

This document records a consolidation of four small, single-purpose microservices into other services (or into a shared library), done to reduce the number of independently deployed processes without changing `api-gateway`'s external behavior. Keep this updated if further services are merged or split.

## Why

The platform ran 19 separate NestJS microservice processes over NATS, each with its own Dockerfile, `docker-compose` entry, and CI build/publish job. Several of these were thin wrappers around one Prisma table or a handful of message patterns — running them as separate deployables added operational overhead (extra containers, extra images, extra CI matrix entries, extra startup-ordering dependencies) without a corresponding need for independent scaling or failure isolation.

## Why this was safe to do without touching `api-gateway`'s logic

This codebase's NATS transport (`@nestjs/microservices` + `Transport.NATS`) routes purely by the `{ cmd: '...' }` subject string, globally, across the shared NATS server — **not** by "service name." The service name passed to `getNatsOptions()` (see `libs/common/src/nats.config.ts`) is only used server-side as a **queue-group name**, for load-balancing multiple instances of the *same* listener. It plays no role in routing a message to the correct handler.

This was confirmed by reading `@nestjs/microservices`' `client-nats.js` / `server-nats.js`, and independently proven by pre-existing code in this repo:
- `apps/organization/src/organization.service.ts` already called a pattern owned by the `notification` service through its own `NATS_CLIENT` proxy.
- `connection`, `issuance`, and `verification` already called `utility`'s `store-object-return-url` pattern through their own proxies, not through a `utility`-specific client.

**Consequence:** as long as *some* process is still subscribed to a given `{cmd}` string, every caller — `api-gateway` included — keeps working unmodified, regardless of which physical process now hosts the handler. That's what made merges 1–3 below fully gateway-transparent, and merge 4 transparent from `api-gateway`'s *endpoint/behavior* perspective (its internal plumbing did change, since the callee stopped being a NATS listener at all).

## What changed

### 1. `webhook` → merged into `organization`

- Moved `WebhookController`, `WebhookService`, `WebhookRepository`, and the webhook interfaces from `apps/webhook/` into `apps/organization/` (controller/service in `apps/organization/src/`, repository in `apps/organization/repositories/`, interfaces in `apps/organization/interfaces/webhook.interface.ts`).
- Registered `WebhookController` in `OrganizationModule.controllers`, and `WebhookService`/`WebhookRepository` in `providers`. `apps/organization/src/main.ts` and its NATS bootstrap (`CommonConstants.ORGANIZATION_SERVICE`) were untouched.
- Deleted `apps/webhook/`.
- Fixed one gateway-side type-only import: `apps/api-gateway/src/webhook/webhook.service.ts` now imports `ICreateWebhookUrl`/`IGetWebhookUrl` from `apps/organization/interfaces/webhook.interface` instead of the deleted `apps/webhook/interfaces/webhook.interfaces`.
- `apps/api-gateway/src/webhook/webhook.module.ts`'s `ClientsModule` registration and all message-pattern strings (`register-webhook`, `get-webhookurl`, `update-webhook`, `post-webhook-response-to-webhook-url`) are unchanged — the gateway still sends the same patterns, now served by the `organization` process.

### 2. `x509` → merged into `organization`

- Moved `X509CertificateController`, `X509CertificateService`, `X509CertificateRepository`, and the x509 interfaces from `apps/x509/` into `apps/organization/`, same layout convention as the webhook move.
- Registered `X509CertificateController`/`Service`/`Repository` in `OrganizationModule`.
- Deleted `apps/x509/`.
- No `api-gateway` files needed changes — nothing in the gateway imported anything from `apps/x509` (unlike webhook, which had one type-only import).
- `apps/organization/src/organization.module.ts` is now this codebase's first module with multiple controllers: `[OrganizationController, WebhookController, X509CertificateController]`.

### 3. `agent-provisioning` → merged into `agent-service`

- Moved `AgentProvisioningService` (the only class with real logic — a single `wallet-provisioning` handler that shells out to the AFJ agent-spinup scripts) into `apps/agent-service/src/agent-provisioning.service.ts`. Its own `IWalletProvision` interface was **not** ported — it was a near-duplicate of `agent-service`'s existing `IWalletProvision` (in `apps/agent-service/src/interface/agent-service.interface.ts`); the moved service now uses that one instead, since the only structural mismatch (`internalIp`, `agentType: string` vs. an enum) didn't affect anything the method body actually used. Three other agent-provisioning interfaces (`IAgentSpinUp`, `IStartStopAgent`, `IPlatformConfig`) were dead code (referenced nowhere) and were dropped rather than carried over.
- **Did not** port `AgentProvisioningController`/`AgentProvisioningModule` — there is no NATS entrypoint for `wallet-provisioning` anymore. Per the chosen approach, `AgentServiceService._walletProvision()` now calls `this.agentProvisioningService.walletProvision(payload)` directly in-process instead of doing a NATS self-send to its own `{cmd:'wallet-provisioning'}` pattern. `AgentProvisioningService` is registered as a plain provider in `AgentServiceModule` and injected into `AgentServiceService`.
- Moved the tracked `AFJ/scripts/` and `AFJ/port-file/` directories from `apps/agent-provisioning/AFJ/` to `apps/agent-service/AFJ/`, and rewrote every `agent-provisioning/AFJ` path reference inside `start_agent.sh`, `docker_start_agent.sh`, `fargate.sh`, and `start_agent_ecs.sh` to `agent-service/AFJ` (a pure rename — the pre-existing `cd`-then-relative-path quirk in `start_agent.sh` that produces a nested nested directory under local/dev runs was left exactly as-is, just renamed consistently; not introduced or fixed by this change).
- Updated `AFJ_AGENT_SPIN_UP` / `AFJ_AGENT_ENDPOINT_PATH` in `.env` and `.env.demo` to the new `agent-service/AFJ/...` paths.
- `CommonConstants.AGENT_PROVISIONING` was removed from `libs/common/src/common.constant.ts` — it was only ever used by the now-deleted `agent-provisioning.module.ts`/`main.ts`, and `api-gateway` never had a client for it (confirmed: zero references to agent-provisioning anywhere under `apps/api-gateway`).
- Deleted `apps/agent-provisioning/` (code). Note: one *untracked*, root-owned local runtime artifact directory — `apps/agent-provisioning/AFJ/agent-config/<uuid>_Platform-admin.json/` — could not be removed (permission denied; it was created by a previous local Docker run as `root`). It is not part of git and does not affect the build; remove it manually with `sudo rm -rf apps/agent-provisioning` if you want it gone.

### 4. `utility` → removed as a microservice, moved into `libs/utility`

This is the one change where `api-gateway` **files** changed, because `utility` was called both by the gateway and by three other microservices directly over NATS, bypassing the gateway entirely.

- New shared lib `libs/utility/` (modeled on `libs/org-roles/`):
  - `src/utility.module.ts` — imports `CommonModule` (for `EmailService`), provides `UtilityService`, `UtilityRepository`, `PrismaService`, `StorageService`; exports `UtilityService`.
  - `src/utility.service.ts` — `UtilityService` (ported from `UtilitiesService`), same four operations: `createAndStoreShorteningUrl`, `getShorteningUrl`, `storeObject`, `handleLedgerAlert`.
  - `src/utility.repository.ts` — `UtilityRepository` (ported from `UtilitiesRepository`), Prisma-backed against `shortening_url` and `platform_config`.
  - `interfaces/shortening-url.interface.ts` — ported as-is.
- `nest-cli.json`'s `"utility"` project entry changed from an `application` to a `library` (`root`/`sourceRoot`/`tsConfigPath` repointed to `libs/utility`).
- Added `@credebl/utility` path mappings to `tsconfig.json` and fixed two **pre-existing** bugs that anticipated this lib but were never wired up correctly: a `tsconfig.json` path entry and a `package.json` jest `moduleNameMapper` entry both read `credebl/utility` (missing the leading `@`) and pointed at a `libs/utility` that didn't exist yet — both now read `@credebl/utility` and resolve correctly.
- Deleted `apps/utility/`.
- **Five call sites migrated** from a NATS `send`/`sendNatsMessage` call to a direct injected `UtilityService` call (each consuming module now imports `UtilityModule`):

  | File | Old pattern | New call |
  |---|---|---|
  | `apps/connection/src/connection.service.ts` (`storeConnectionObjectAndReturnUrl`) | NATS `{cmd:'store-object-return-url'}` via its own proxy | `this.utilityService.storeObject({ persistent, storeObj })` |
  | `apps/issuance/src/issuance.service.ts` (`storeIssuanceObjectReturnUrl`) | NATS `{cmd:'store-object-return-url'}` via `natsCall` | `this.utilityService.storeObject({ persistent, storeObj })` |
  | `apps/verification/src/verification.service.ts` (`storeVerificationObjectAndReturnUrl`) | NATS `{cmd:'store-object-return-url'}` via its own proxy | `this.utilityService.storeObject({ persistent, storeObj })` |
  | `apps/api-gateway/src/utilities/utilities.service.ts` (`createShorteningUrl`, `storeObject`, and the ledger-null-alert `LISTEN`/`NOTIFY` handler) | NATS `create-shortening-url`, `store-object-return-url`, `alert-db-ledgerId-null` | `this.utilityService.createAndStoreShorteningUrl(...)`, `.storeObject(...)`, `.handleLedgerAlert(emailDto)` |
  | `apps/api-gateway/src/platform/platform.service.ts` (`getShorteningUrlById`) | NATS `get-shortening-url` via `platformServiceProxy` (a *different* client than utility's own) | `this.utilityService.getShorteningUrl(referenceId)` |

  `apps/api-gateway/src/utilities/utilities.service.ts`'s other two NATS calls (`get-all-intent-templates-by-query`, `get-intent-template-by-intent-and-org`) were **left untouched** — those patterns belong to a different microservice, not `utility`.

## Infra changes applied

- **`nest-cli.json`**: removed the `webhook`, `agent-provisioning`, `x509` application entries; converted `utility` to a library entry.
- **Dockerfiles**: deleted `Dockerfile.webhook`, `Dockerfile.agent-provisioning`, `Dockerfile.x509`, `Dockerfile.utility`. `Dockerfile.agent-service` now also creates/copies/chmods the `AFJ/` scripts and port-file directories (previously `Dockerfile.agent-provisioning`'s job), at the new `apps/agent-service/AFJ/...` path, while keeping its own `pnpm prune --prod` step.
- **`docker-compose.yml` / `docker-compose-dev.yml`**: removed the `webhook`, `agent-provisioning`, `x509`, `utility` service blocks. `connection` no longer `depends_on: utility`. `agent-service` no longer depends on/waits for `agent-provisioning`'s container log line or uses `volumes_from: agent-provisioning`; it now owns the `AFJ/agent-config` (+ `token` in dev) volume mounts directly, alongside its existing `/var/run/docker.sock` mount.
- **`.env` / `.env.demo`**: `AFJ_AGENT_SPIN_UP` / `AFJ_AGENT_ENDPOINT_PATH` repointed to `agent-service/AFJ/...`.
- **`.github/workflows/continuous-delivery.yml`**: removed `webhook`, `agent-provisioning`, `x509`, `utility` from the release build matrix.
- **`scripts/taskdef/`**: deleted `agent-provisioning-taskdef.json`, `webhook-taskdef.json`, `utility-taskdef.json` (ECS Fargate task definitions); `agent-service-taskdef.json` gained the EFS-backed `agent-config`/`port-file` volume mounts that `agent-provisioning-taskdef.json` used to define, repointed to `/app/agent-service/AFJ/...`. No `x509-taskdef.json` existed to begin with.

## What did *not* change

- `apps/api-gateway`'s external HTTP endpoints, request/response contracts, and NATS message-pattern strings are all unchanged.
- `RustFsStorageService`/local-fs storage and any AWS/OpenBao secret-fetching logic are unrelated to this consolidation and were not touched.

## Verification performed

- `pnpm run build organization`, `build agent-service`, `build connection`, `build issuance`, `build verification`, and `build api-gateway` all compiled successfully after the changes.
- Repo-wide grep for `apps/webhook`, `apps/x509`, `apps/agent-provisioning`, `apps/utility` returns no remaining source references.
- `docker compose -f docker-compose-dev.yml config` validates cleanly.

## If you need to merge another service later

The general recipe used here:
1. Confirm no message-pattern collisions between the two services (`@MessagePattern`/`@EventPattern` strings must all stay globally unique).
2. Check for callers **other than `api-gateway`** — any other microservice calling the target service's patterns directly over NATS needs its call sites updated too if you're fully retiring a NATS listener (as with `utility`); if you're merging two still-NATS-based services together (as with `webhook`/`x509`/`agent-provisioning`), this doesn't matter since routing is subject-based.
3. Move controller/service/repository/interfaces into the target app (or a `libs/` package if fully retiring the NATS surface), wire into the target module's `controllers`/`providers`.
4. Update `nest-cli.json`, the relevant `Dockerfiles/Dockerfile.*`, both `docker-compose*.yml` files, the CI release matrix, and any ECS task definitions.
5. Build every touched app to confirm no compile/module-resolution errors, and grep for leftover references to the old `apps/<service>` path.
