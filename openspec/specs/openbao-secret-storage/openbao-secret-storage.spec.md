# OpenBao Secret Storage

## Purpose

Define how the platform stores and loads credentials/secrets used at runtime by email and file-storage integrations. Secrets are sourced from local environment variables by default and may optionally be sourced from an OpenBao server (a HashiCorp Vault-compatible secrets engine) instead.

The feature has two loading modes:

1. **Startup injection** — every microservice bootstrap fetches secrets once and injects them into `process.env` before the NATS listener starts.
2. **Runtime lookup with caching** — email and S3 clients fetch their own credential sets on demand through a TTL-cached per-path loader, so credentials can be rotated without restarting the service.

## Requirements

### secret-provider-interface

A shared contract for any remote secrets provider so providers are interchangeable behind one factory.

- **Must** define a `SecretProvider` interface exposing a human-readable `name` used for logging.
- **Must** define a `loadSecrets(options?: Record<string, unknown>)` method returning a flat `Record<string, string>` of key/value secrets.
- **Must** expose a `getSecretProvider(providerType)` factory that returns a provider for the value `openbao` (case-insensitive) and `null` for any other value.
- **Will** support future providers (e.g. AWS Secrets Manager) via the same factory without call-site changes.

#### Scenario: unknown provider value

- **When** `getSecretProvider` is called with a value other than `openbao`
- **Then** it returns `null`.

#### Scenario: case-insensitive provider lookup

- **When** `getSecretProvider` is called with `OpenBao` or `OPENBAO`
- **Then** it returns an `OpenBaoProvider` instance.

### openbao-provider-configuration

The OpenBao provider reads its connection settings from the process environment.

- **Must** read `BAO_URL`, `BAO_SECRET_PATH`, `BAO_ROLE_ID`, and `BAO_SECRET_ID` from `process.env`.
- **Must** throw an error listing all required variables when any of them is missing or empty.
- **Must** allow the secret path to be overridden per call via a `customPath` option passed to `loadSecrets`.
- **Must** enforce a request timeout of `CommonConstants.OPENBAO_REQUEST_TIMEOUT` (10 seconds) on every OpenBao HTTP request.
- **Will** treat a request aborted by the timeout as a failure and throw a `...timed out` error.

#### Scenario: missing environment configuration

- **When** any of `BAO_URL`, `BAO_SECRET_PATH`, `BAO_ROLE_ID`, `BAO_SECRET_ID` is unset
- **Then** `loadSecrets` rejects with an error naming the missing variables.

#### Scenario: custom secret path

- **When** `loadSecrets` is called with `{ customPath: 'secret/data/custom' }`
- **Then** the provider fetches `BAO_URL/v1/secret/data/custom` instead of the `BAO_SECRET_PATH` value.

### openbao-approle-authentication

The provider authenticates to OpenBao using the AppRole auth method and exchanges role credentials for a client token.

- **Must** POST `{ role_id, secret_id }` as a JSON body to `{BAO_URL}/v1/auth/approle/login`.
- **Must** throw an `Authentication failed: Status <code>` error when the login response is not ok.
- **Must** throw a `Failed to retrieve client token from OpenBao.` error when the login succeeds but the response contains no `auth.client_token`.
- **Must** send the obtained client token on subsequent secret requests via the `X-Vault-Token` header.
- **Will** reject with `OpenBao authentication request timed out.` when the login request is aborted by the timeout.

#### Scenario: rejected AppRole credentials

- **When** OpenBao answers the login request with a non-2xx status
- **Then** the provider throws `Authentication failed: Status <code>`.

#### Scenario: login response without a token

- **When** the login response is ok but carries no `auth.client_token`
- **Then** the provider throws `Failed to retrieve client token from OpenBao.`.

### openbao-kv-secret-retrieval

The provider reads a KV secrets engine path using the authenticated token.

- **Must** GET `{BAO_URL}/v1/{secretPath}` with the `X-Vault-Token` header.
- **Must** throw `Fetch failed: Status <code>` when the read response is not ok.
- **Must** read the secret data from the KV v2 payload shape `result.data.data`.
- **Must** throw `Unexpected secrets payload structure.` when `data.data` is missing, not an object, or an array.
- **Must** return the secret map as a flat `Record<string, string>`.
- **Will** reject with `OpenBao secrets fetch request timed out.` when the read request is aborted by the timeout.

#### Scenario: unexpected payload shape

- **When** OpenBao returns a payload without a `data.data` object
- **Then** the provider throws `Unexpected secrets payload structure.`.

#### Scenario: successful secret retrieval

- **When** authentication succeeds and the KV path returns `{ data: { data: { RESEND_API_KEY: 'x' } } }`
- **Then** `loadSecrets` resolves to `{ RESEND_API_KEY: 'x' }`.

### startup-secret-injection

Every microservice loads remote secrets into `process.env` before its NATS microservice is created and starts listening.

- **Must** gate startup injection on `ENABLE_BAO` being exactly `true` after trimming and lowercasing.
- **Must** skip injection without error when `ENABLE_BAO` is not `true`.
- **Must** skip injection without error when `SECRETS_PROVIDER` is not set.
- **Must** log a warning and continue with local environment variables when `SECRETS_PROVIDER` names an unsupported provider.
- **Must** inject every fetched secret into `process.env` as an enumerable, configurable, writable string property.
- **Must** skip keys named `__proto__`, `constructor`, or `prototype` during injection.
- **Must** log a `Critical Lifecycle Boot Failure` error and continue startup when the provider throws, rather than crashing the bootstrap.
- **Must** run `await loadConfigSecrets()` before `NestFactory.createMicroservice(...)` in every `apps/*/src/main.ts` bootstrap.
- **Will** be invoked through the `@credebl/config` package root export.

#### Scenario: secrets management disabled

- **When** `ENABLE_BAO` is unset, `false`, or `FALSE`
- **Then** `loadConfigSecrets` returns without reading from any provider.

#### Scenario: unsupported provider value

- **When** `SECRETS_PROVIDER=consul`
- **Then** `loadConfigSecrets` logs a warning and returns without throwing.

#### Scenario: malicious secret keys are filtered

- **When** the provider returns a secret whose key is `__proto__`
- **Then** that entry is skipped and `process.env` is not polluted.

#### Scenario: provider failure does not block boot

- **When** the provider rejects while loading secrets
- **Then** the error is logged and `loadConfigSecrets` resolves instead of rejecting.

### runtime-secret-loading-with-cache

Email and storage integrations fetch their credential sets on demand from the configured provider, cached per secret path.

- **Must** expose a `fetchSecrets(secretPath)` helper in `libs/common/src/utils/secretLoader.util.ts`.
- **Must** return an empty object without calling the provider when `ENABLE_BAO` is not `true`.
- **Must** return an empty object when `SECRETS_PROVIDER` is unset or names an unsupported provider.
- **Must** call `provider.loadSecrets({ customPath: secretPath })` when a provider is active.
- **Must** cache the result per secret path for a TTL of 10 minutes.
- **Must** share the cache module-wide across all consumers (email + storage) for a given path.

#### Scenario: runtime fetch for a specific path

- **When** `fetchSecrets('secret/data/credebl_smtp_config')` is called with OpenBao enabled
- **Then** the provider is invoked with `customPath` set to that path and its result is returned.

#### Scenario: subsequent reads are served from cache

- **When** `fetchSecrets` is called twice with the same path while the entry is unexpired
- **Then** the provider is only invoked once.

### ttl-cache-semantics

The TTL cache preserves a fetched value for a duration and re-fetches once it lapses.

- **Must** invoke the fetch function on first read and store the result.
- **Must** return the stored value on subsequent reads without re-invoking the fetch function.
- **Must** treat the TTL as sliding: any read refreshes the expiry timer.
- **Must** clear the stored value once `ttlMs` of inactivity elapses.
- **Must** provide a `clear()` method that drops the stored value and cancels the pending expiry timer.
- **Will** schedule expiry so that an idle process is not kept alive by the pending timer.

#### Scenario: expiry triggers a re-fetch

- **When** a value is read again after `ttlMs` of inactivity has elapsed
- **Then** the fetch function runs again and the fresh value is returned.

#### Scenario: sliding window keeps a hot entry alive

- **When** a value is read repeatedly at intervals shorter than `ttlMs`
- **Then** the fetch function is never re-invoked and the same value is returned.

### email-credential-sourcing

Email providers resolve their credentials at runtime, preferring provider-sourced secrets over environment variables.

- **Must** resolve the Resend API key from `secret/data/credebl_resend_api_key` (`RESEND_API_KEY`) or fall back to `process.env.RESEND_API_KEY`.
- **Must** resolve the SendGrid API key from `secret/data/credebl_sendgrid_api_key` (`SENDGRID_API_KEY`) or fall back to `process.env.SENDGRID_API_KEY`.
- **Must** resolve SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) from `secret/data/credebl_smtp_config` or fall back to the matching environment variables.
- **Must** treat a missing/invalid SMTP port as a failure.
- **Must** return `false` and log the error when a required credential is missing or a send fails, rather than throwing to the caller.
- **Must** configure the SMTP transport with `secure: true` for port 465 and `requireTLS: true` for port 587.

#### Scenario: missing email credential

- **When** the provider returns no Resend key and `RESEND_API_KEY` is unset
- **Then** `sendWithResend` logs an error and returns `false`.

#### Scenario: invalid SMTP port

- **When** `SMTP_PORT` is not a positive integer
- **Then** `sendWithSMTP` logs an error and returns `false`.

#### Scenario: provider secrets take precedence

- **When** the provider returns `RESEND_API_KEY` and the same env var is set to a different value
- **Then** the client is constructed with the provider-sourced key.

### storage-credential-sourcing

S3 storage clients resolve their AWS credentials at runtime from the shared `secret/data/credebl_aws_keys` path.

- **Must** resolve internal S3 credentials from `AWS_ACCESS_KEY`/`AWS_SECRET_KEY` or fall back to the matching env vars.
- **Must** resolve public (logo/URL) S3 credentials from `AWS_PUBLIC_ACCESS_KEY`/`AWS_PUBLIC_SECRET_KEY` or fall back to the matching env vars.
- **Must** resolve store-object S3 credentials from `AWS_S3_STOREOBJECT_ACCESS_KEY`/`AWS_S3_STOREOBJECT_SECRET_KEY` or fall back to the matching env vars.
- **Must** read the region for each client from `AWS_REGION`, `AWS_PUBLIC_REGION`, and `AWS_S3_STOREOBJECT_REGION` respectively.
- **Will** leave the RustFS/local storage providers reading credentials exclusively from the environment.

#### Scenario: provider-sourced AWS keys

- **When** OpenBao returns `AWS_ACCESS_KEY`/`AWS_SECRET_KEY` at the AWS key path
- **Then** the internal S3 client is constructed with those values.

### deployment-artifacts

The repository ships demo configuration and container artifacts for running OpenBao.

- **Must** document the `ENABLE_BAO` and `SECRETS_PROVIDER` gating variables and the `BAO_URL`, `BAO_SECRET_PATH`, `BAO_ROLE_ID`, and `BAO_SECRET_ID` placeholders in `.env.demo`.
- **Must** provide a `docker-compose.openbao.yml` that runs an `openbao/openbao` server exposing port 8200 with file-backed storage persisted on a named volume.
- **Must** provide an HCL server configuration (`config.hcl`) declaring file storage at `/openbao/file`, a TCP listener on `0.0.0.0:8200` with TLS disabled, and the UI enabled.
- **Must** provide a `openbao-init.sh` script that idempotently initializes and unseals the server, enables KV v2 at `secret/`, enables AppRole auth, creates the `credebl` role scoped to the `credebl_*` paths, generates the `role_id`/`secret_id`, and stores the secret data from the matching environment variables.
- **Will** require the operator to run `openbao-init.sh` once and copy the printed `BAO_ROLE_ID`/`BAO_SECRET_ID` into `.env.demo` before the platform can use the provider.

#### Scenario: demo environment placeholders

- **When** an operator follows the demo setup
- **Then** `.env.demo` exposes the two gating variables and the four `BAO_*` variables to configure the provider.

#### Scenario: local OpenBao server

- **When** `docker compose -f docker-compose.openbao.yml up` is run
- **Then** an OpenBao server is available on `127.0.0.1:8200` and its data survives restarts via the named volume.

#### Scenario: one-shot provisioning via the init script

- **When** `./openbao-init.sh` is run against a freshly started server
- **Then** the server is initialized and unsealed, KV v2 and AppRole are enabled, the `credebl` role exists, and the script prints `BAO_ROLE_ID`/`BAO_SECRET_ID` ready for `.env.demo`.
- **And** re-running the script does not re-initialize the server or regenerate the `role_id`/`secret_id`.
