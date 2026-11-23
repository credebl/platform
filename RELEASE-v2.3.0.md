# CREDEBL Platform v2.3.0

Released together with agent-controller v2.3.3 (`AFJ_VERSION=ghcr.io/credebl/credo-controller:v2.3.3`).
Previous stable release: v2.2.0. Draft: confirm against the final merged PR list before tagging.

## Agent controller compatibility
- **Requires agent-controller v2.3.3.** This release pins v2.3.3. The image name is unchanged: `ghcr.io/credebl/credo-controller`. The rename to `agent-controller` is deferred upstream.
- **What 2.3.3 adds that the platform uses:**
  - **OID4VCI issuer notifications** (credebl/agent-controller#492). Issuers advertise a `notification_endpoint`, return a `notification_id` with each credential, and post wallet notifications on the `/openid4vc-issuance` webhook with `notification` and `notifications[]`. The platform relays them (#1845). `OID4VCI_NOTIFICATION_ENDPOINT_ENABLED=false` turns the endpoint off. A wallet can report a notification only while the session's access token is valid (`OID4VCI_ACCESS_TOKEN_EXPIRY`, default 3600 s).
  - **`did:x509` import** (credebl/agent-controller#473), used by #1823. An older agent returns an "upgrade the agent" error.
  - **KMS backend of X.509 keys** (credebl/agent-controller#478), used by #1824. With an older agent, new certificates have no `kmsBackend`.
- **did:polygon needs a setting.** Controller 2.3.3 turns plaintext key import off by default. The platform creates did:polygon DIDs by sending `privatekey` to the agent (`POST /dids/write`), and the controller now answers 400 for it. Until the platform sends an encrypted key (`encryptedKey` from `POST /dids/import/session`), set `ALLOW_PLAINTEXT_KEY_IMPORT=true` in the agent environment of deployments that create did:polygon DIDs (credebl/platform#1856).
- **Other 2.3.3 additions the platform does not use yet:** an optional OpenBao KMS, `selectedCredentials` and `verifierResponse` on `accept-proof-request`, the whole DCQL query in presentation requests, bitstring-status revocation and an optional Indy ledger (OID4VP holder endpoints: credebl/platform#1855).
- **Holder behaviour in 2.3.3:**
  - **Notifications on by default:** `POST /openid4vc/holder/request-credential` sends `credential_accepted` (or `credential_failure`) to the issuer's notification endpoint. Turn this off with `sendNotification: false` in the request body.
  - **New `notification` field:** each credential returned by `request-credential` has a `notification` field: `{ status: "sent", event }`, `{ status: "skipped", reason }` or `{ status: "failed", event, reason }`. The record fields are unchanged. A notification that can't be sent never fails the request.
- **`did:web` in 2.3.3:**
  - **Stricter validation:** `POST /dids/write` with `method: web` validates the domain and the optional `:`-separated path (credebl/agent-controller#484). An invalid host, an empty segment or `..` now returns 400.
  - **New `POST /dids/web/import`:** imports a `did:web` document and keys issued and hosted by an external authority (credebl/agent-controller#489).
- **Earlier 2.3.x changes still apply:**
  - **2.3.1:** optional holder-binding fields on `request-credential` (`holderDidUrl`, `bindingPolicy`), and Credo 0.7.0 -> 0.7.4 (no storage migration).
  - **2.3.2:** binding `ldp_vc` credentials to a `did:web` holder, and `Ed25519VerificationKey2020` support; the platform's `did:web` default for `ldp_vc` (#1820) relies on these. Since 2.3.2, `credentialSubject.id` of new W3C credentials is the holder's bare DID, and DCQL `ldp_vc` queries must use expanded JSON-LD IRIs in `meta.type_values`.
- **From 2.3.0:** W3C JSON-LD end to end (`ldp_vc` over OID4VC, DCQL verification), X.509 chain support, a tenant session leak fix, and a Node 26 base image. Rebuild agent images rather than reusing cached layers.
- **Holder list endpoints** (SD-JWT, mdoc, W3C) return a plain array when called with no query parameters, but an envelope `{ data, pagination, filters? }` once any parameter is sent. The platform on `main` does not call these endpoints. Any holder-management work (for example #1792) must handle both shapes.

## Features
- OpenBao secret storage (provider, provisioning script, `docker-compose.openbao.yml`, docs/tests) (#1679, #1712)
- Rust FS / local storage support via `@credebl/storage` (#1670)
- OID4VC: `jwt_vc_json-ld` / `ldp_vc` (JSON-LD) credential format support (#1646)
- OID4VC: holder binding methods (`cryptographic_binding_methods_supported`) are configurable per template and per issuer, and `ldp_vc` advertises `did:web` by default. See `docs/oid4vc-holder-binding-methods.md` (#1820)
- OID4VCI: wallet notifications (`credential_accepted`, `credential_failure`, `credential_deleted`) are relayed to the organization's webhook. A post with `data.notification` is a notification; the session state stays `Completed`. The notification history is stored per issuance session. See `docs/oid4vci-wallet-notifications.md` (#1845)
- DIDs: import a CA issued certificate chain and its key as a `did:x509` (`POST /orgs/:orgId/agents/did/x509/import`) and read its chain (`GET /orgs/:orgId/agents/did/x509/chain/:did`) (#1823)
- X.509: the KMS backend of each certificate (`askar`, `node` or `openbao`) is stored and returned by the X.509 APIs (#1824)
- Swagger UIs exposed per module group (#1608)
- API gateway version via `API_GATEWAY_VERSION` env (#1777)
- Row-level security migration `enable_rls_if_not_exists` (#1688)

## Fixes
- Agent provisioning: scripts run with `execFile` arguments instead of shell interpolation (#1708)
- Cloud wallet: holder wallet resolution scoped to the authenticated user, base wallet configuration restricted to platform administrators, agent health checks use the holder tenant token (#1727)
- Agent service: creating a DID for an organization with many DIDs no longer deadlocks (#1836)
- Seed: `prisma db seed` finds `ts-node` (#1822)
- Invitation: return `org_invitations` array; fetch last `invitationDid` (#1725, #1760)
- Template validation returns JSON error instead of a download link (#1763)
- `sendError` no longer crashes on undefined errors (#1743)
- Swagger redirect (#1572)
- SonarQube security hotspots (#1744); critical/high Dependabot vulnerabilities (#1729)
- Shortening-URL `attributes` validation: empty-attribute response and issuance-pattern fixes (#1696)

## Dependencies (potentially breaking for custom builds)
- nodemailer 7 -> 10, nanoid 4 -> 5 (ESM-only), firebase-admin 13 -> 14, axios 0.26/1.16 -> 1.20
- `@opentelemetry/sdk-node` 0.202 -> 0.221
- Removed: html-pdf, puppeteer, node-html-to-image, auth0-js, winston-elasticsearch, @elastic/ecs-winston-format
- Minor and patch dependency updates (#1816, #1848); nats 2.15.2 in compose (#1814)
- pnpm security overrides added; pnpm 9.15.9

## Upgrade notes
- **Migrations:** run `prisma migrate deploy`. New since v2.2.0:
  - `enable_rls_if_not_exists`: row-level security. Test on a copy of production data first (#1688).
  - `add_cryptographic_binding_methods_to_oidc_issuer`: adds `oidc_issuer.cryptographicBindingMethods TEXT[] DEFAULT '{}'`; additive, no backfill (#1820).
  - `add_kms_backend_to_x509_certificates`: adds a nullable `x509_certificates.kmsBackend` column and backfills existing rows (key ids starting with `ob_` become `openbao`, all others `askar`) (#1824).
  - `add_did_archive_and_usage_tracking`: adds `org_dids.archivedAt`, `isArchived` (default `false`) and `wasPrimary` (default `true`) (#1824).
  - `add_notifications_to_oid4vc_credentials`: adds a nullable `oid4vc_credentials.notifications` jsonb column; additive, no backfill (#1845).
- **Existing OID4VC issuers and templates:** they keep the binding methods already published in their agent metadata until their configuration is pushed to the agent again. This includes the new `did:web` default for `ldp_vc`.
  - To re-sync an issuer, update it (`POST /v1/orgs/{orgId}/oid4vc/issuers/{issuerId}`). That re-pushes the issuer configuration.
  - A template's binding methods are pushed when the template is created or updated (`PATCH /v1/orgs/{orgId}/oid4vc/{issuerId}/template/{templateId}`).
  - Issuers created after the upgrade get the new configuration directly (#1820).
- **OID4VCI issuance webhook:**
  - **Validation:** `notification` is validated, and an invalid one gets `400`. The `notifications` history is accepted in any shape, so it can never cause a state-change webhook to be rejected. Only its well-formed entries are stored, and the `oid4vc-issuance` service logs the rest as a warning.
  - **Webhook consumers:** organization webhook consumers should not treat a post with `data.notification` as a state change (#1845).
- **Agent provisioning:** deploy `agent-service` and `agent-provisioning` together (#1708).
- **Environment:**
  - New agent env vars in `agent.env`: `STATUS_LIST_SERVER_URL`, `STATUS_LIST_API_KEY`, `STATUS_LIST_DEFAULT_SIZE`. New platform var `STATUS_LIST_HOST` in `.env.demo`.
  - OpenBao is optional; see `openspec/specs/openbao-secret-storage` and `docker-compose.openbao.yml`.
- **Controller image:** pin it with `AFJ_VERSION` to `ghcr.io/credebl/credo-controller:v2.3.3`.
