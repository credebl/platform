# CREDEBL Platform v2.3.0

Released together with agent-controller v2.3.3 (`AFJ_VERSION=ghcr.io/credebl/credo-controller:v2.3.3`).
Previous stable release: v2.2.1. This release lists what was merged after v2.2.1 (it includes everything first shipped in the v2.3.0 release candidates).

## Agent controller compatibility
- **Requires agent-controller v2.3.3.** This release pins v2.3.3. The image name is unchanged: `ghcr.io/credebl/credo-controller`. The rename to `agent-controller` is deferred upstream.
- **What 2.3.3 adds that the platform uses:**
  - **OID4VCI issuer notifications** (credebl/agent-controller#492). Issuers advertise a `notification_endpoint`, return a `notification_id` with each credential, and post wallet notifications on the `/openid4vc-issuance` webhook with `notification` and `notifications[]`. The platform relays them (#1845). `OID4VCI_NOTIFICATION_ENDPOINT_ENABLED=false` turns the endpoint off. A wallet can report a notification only while the session's access token is valid (`OID4VCI_ACCESS_TOKEN_EXPIRY`, default 3600 s).
  - **`did:x509` import** (credebl/agent-controller#473), used by #1823. An older agent returns an "upgrade the agent" error.
  - **KMS backend of X.509 keys** (credebl/agent-controller#478), used by #1824. With an older agent, new certificates have no `kmsBackend`.
- **did:polygon needs a setting.** Controller 2.3.3 turns plaintext key import off by default. The platform creates did:polygon DIDs by sending `privatekey` to the agent (`POST /dids/write`), and the controller now answers 400 for it. Until the platform sends an encrypted key (`encryptedKey` from `POST /dids/import/session`), set `ALLOW_PLAINTEXT_KEY_IMPORT=true` in the agent environment of deployments that create did:polygon DIDs (credebl/platform#1856).
- **Other 2.3.3 additions the platform does not use yet:** an optional OpenBao KMS, `selectedCredentials` and `verifierResponse` on `accept-proof-request`, the whole DCQL query in presentation requests and an optional Indy ledger (OID4VP holder endpoints: credebl/platform#1855).
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
- **Holder list endpoints** (SD-JWT, mdoc, W3C) return a plain array when called with no query parameters, but an envelope `{ data, pagination, filters? }` once any parameter is sent. Since #1792 the cloud wallet calls them without query parameters and returns the plain array. Any code that sends parameters must handle both shapes.

## Features
New since v2.2.1.
- **OpenBao secret storage:** provider, provisioning script, `docker-compose.openbao.yml`, docs and tests (#1679), and the refactor of the OpenBao and secret-provider logic (#1712). It is optional and controlled by `ENABLE_BAO`, `SECRETS_PROVIDER` and the `BAO_*` variables.
- **Revocation with Bitstring Status List:** JSON-LD credentials can be issued as revocable (`isRevocable`, `credentialVersion` `v1.0` or `v2.0`) with a `BitstringStatusListEntry`. New `POST /orgs/:orgId/credentials/:threadId/revoke` revokes DIDComm credentials, idempotently. OID4VC revocation of SD-JWT VC, `jwt_vc_json-ld` and `ldp_vc` credentials is now persisted (`revokedAt`). Status-list allocation moved to the shared `@credebl/status-list` library. OID4VP verification returns a structured result for revoked or failed sessions instead of a generic error (#1831)
- **Cloud wallet, credential management:** list holder credentials by format (`GET /holder/sd-jwt-vcs`, `/holder/mdoc-vcs`, `/holder/w3c-vcs`), decode mdoc and SD-JWT credentials, delete credentials, and run OpenID4VCI (`resolve-credential-offer`, `authorization-request`, `request-credential`) and OpenID4VP (`resolve-proof-request`, `accept-proof-request`) flows (#1792)
- **Cloud wallet, DID binding:** a holder can bind OID4VC credentials to a DID of its wallet. `POST /v1/oid4vc/holder/request-credential` takes the optional fields `holderDidUrl` (bind to that DID's key instead of a new key), `bindingPolicy` (`require`, the default when `holderDidUrl` is set, or `prefer`) and `sendNotification`. This needs agent-controller v2.3.1 or later. `POST /v1/did/import/session` accepts `key` and `web` as well as `polygon`, so an existing key can be imported as a `did:web` (#1852)
- **OID4VC holder binding methods** (`cryptographic_binding_methods_supported`) are configurable per template and per issuer, and `ldp_vc` advertises `did:web` by default. See `docs/oid4vc-holder-binding-methods.md` (#1820)
- **RS256 holder proofs:** issuer metadata accepts `RS256` proofs for `dc+sd-jwt` and `jwt_vc_json-ld`, so a holder whose `did:web` uses an RSA key (for example an Indian Class 3 DSC) can receive a bound credential. `mso_mdoc` is unchanged (#1851)
- **OID4VC offer checks, readable offer states and reissue:**
  - Offer and session ids that are not UUIDs return 400, not 500.
  - The `mso_mdoc` signing algorithm in issuer metadata is the COSE number `-7`.
  - An mDoc offer is checked before it is created: the signing certificate must have a country, and `issuing_country` must match it (422 otherwise).
  - Get offer and list offers return a `status` object (`label`, `description`, `canBeRedeemed`, `needsNewOffer`).
  - New `POST /orgs/{orgId}/oid4vc/credential-offer/{offerId}/reissue` (owner only) creates a new offer for an offer that was used or has expired (#1838)
- **OID4VCI wallet notifications** (`credential_accepted`, `credential_failure`, `credential_deleted`) are relayed to the organization's webhook. A post with `data.notification` is a notification; the session state stays `Completed`. The notification history is stored per issuance session. See `docs/oid4vci-wallet-notifications.md` (#1845)
- **`did:x509`:** import a CA issued certificate chain and its key (`POST /orgs/:orgId/agents/did/x509/import`) and read its chain (`GET /orgs/:orgId/agents/did/x509/chain/:did`); the chain is kept with the certificate (#1823)
- **X.509 and DIDs:** the KMS backend of each X.509 certificate and each DID (`askar`, `node` or `openbao`) is stored and returned by the APIs, and DID archive state and primary history are tracked (#1824)
- Swagger UIs exposed per module group, switched with `ENABLE_SWAGGER` (#1608)
- API gateway version via the `API_GATEWAY_VERSION` env (#1777)
- Changesets for release notes and versioning (#1830). Contributors add a changeset with `pnpm changeset`; see `CONTRIBUTING.md`

## Fixes
- Agent provisioning: scripts run with `execFile` arguments instead of shell interpolation (#1708)
- Cloud wallet: holder wallet resolution scoped to the authenticated user, base wallet configuration restricted to platform administrators, agent health checks use the holder tenant token (#1727)
- Cloud wallet: creating a cloud wallet no longer fails on agents that run Credo 0.7 (#1852)
- Agent service: creating a DID for an organization with many DIDs no longer deadlocks (#1836)
- Seed: `prisma db seed` finds `ts-node` (#1822)
- Notification: uses the firebase-admin 14 modular API (#1813)
- Invitation: return `org_invitations` array; fetch last `invitationDid` (#1725, #1760)
- Template validation returns a JSON error instead of a download link (#1763)
- `sendError` no longer crashes on undefined errors (#1743)
- Swagger redirect (#1572)
- Security: critical and high Dependabot vulnerabilities (#1729), SonarQube security hotspots (#1744), and critical container image vulnerabilities (#1775)

## Dependencies (potentially breaking for custom builds)
- Major upgrades: nodemailer 7 -> 10, nanoid 4 -> 5 (ESM-only), firebase-admin 13 -> 14, axios 1.16 -> 1.21, uuid 9 -> 11, `@opentelemetry/sdk-node` 0.202 -> 0.300
- Removed unused packages: html-pdf, puppeteer, node-html-to-image, auth0-js (#1784)
- Docker compose: redis 6.2-alpine -> 8.10-alpine; nats pinned to 2.15.2
- Minor and patch dependency updates (#1816, #1848); pnpm security overrides added; pnpm 9.15.3 -> 9.15.9

## Upgrade notes
- **Migrations:** run `prisma migrate deploy`. Eight migrations are new since v2.2.1, all additive:
  - `add_cryptographic_binding_methods_to_oidc_issuer`: adds `oidc_issuer.cryptographicBindingMethods TEXT[] DEFAULT '{}'`, no backfill (#1820).
  - `add_bitstring_status_to_credentials`: adds `statusListId`, `statusListIndex`, `statusListUri`, `credentialVersion` and `revokedAt` to `credentials`, with a unique index on `(statusListId, statusListIndex)` (#1831).
  - `add_revoked_at_to_issued_oid4vc_credentials`: adds `issued_oid4vc_credentials.revokedAt` (#1831).
  - `add_kms_backend_to_x509_certificates`: adds a nullable `x509_certificates.kmsBackend` column and backfills existing rows (key ids starting with `ob_` become `openbao`, all others `askar`) (#1824).
  - `add_did_archive_and_usage_tracking`: adds `org_dids.archivedAt`, `isArchived` (default `false`) and `wasPrimary` (default `true`) (#1824).
  - `add_kms_backend_to_org_dids`: adds a nullable `org_dids.kmsBackend` column (#1824).
  - `add_certificate_chain_to_x509_certificates`: adds `x509_certificates.certificateChain TEXT[]`, default empty (#1823).
  - `add_notifications_to_oid4vc_credentials`: adds a nullable `oid4vc_credentials.notifications` jsonb column, no backfill (#1845).
- **Existing OID4VC issuers and templates:** they keep the binding methods and proof algorithms already published in their agent metadata (including the new `did:web` default for `ldp_vc` and `RS256` proofs) until their configuration is pushed to the agent again.
  - To re-sync an issuer, update it (`POST /v1/orgs/{orgId}/oid4vc/issuers/{issuerId}`). That re-pushes the issuer configuration.
  - A template's binding methods are pushed when the template is created or updated (`PATCH /v1/orgs/{orgId}/oid4vc/{issuerId}/template/{templateId}`).
  - Issuers created after the upgrade get the new configuration directly (#1820, #1851).
- **OID4VCI issuance webhook:**
  - **Validation:** `notification` is validated, and an invalid one gets `400`. The `notifications` history is accepted in any shape, so it can never cause a state-change webhook to be rejected. Only its well-formed entries are stored, and the `oid4vc-issuance` service logs the rest as a warning.
  - **Webhook consumers:** organization webhook consumers should not treat a post with `data.notification` as a state change (#1845).
- **Agent provisioning:** deploy `agent-service` and `agent-provisioning` together (#1708).
- **Docker compose:** redis moves from 6.2 to 8.10. Check your data and persistence settings before pulling the new image.
- **Environment:** new platform variables in `.env.demo`: `API_GATEWAY_VERSION`, `ENABLE_SWAGGER`, and for the optional OpenBao provider `ENABLE_BAO`, `SECRETS_PROVIDER`, `BAO_URL`, `BAO_SECRET_PATH`, `BAO_ROLE_ID` and `BAO_SECRET_ID`. See `openspec/specs/openbao-secret-storage` and `docker-compose.openbao.yml`.
- **Controller image:** pin it with `AFJ_VERSION` to `ghcr.io/credebl/credo-controller:v2.3.3`.
