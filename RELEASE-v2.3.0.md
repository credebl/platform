# CREDEBL Platform v2.3.0

Released together with agent-controller v2.3.2 (`AFJ_VERSION=ghcr.io/credebl/credo-controller:v2.3.2`).
Previous stable release: v2.2.0. Draft: confirm against the final merged PR list before tagging.

## Agent controller compatibility
- Requires agent-controller v2.3.2 (released 2026-11-04), which follows 2.3.0 (2026-10-30) and 2.3.1 (2026-11-03). 2.3.1 adds optional holder-binding fields to `POST /openid4vc/holder/request-credential` and Credo 0.7.0 -> 0.7.4 (no storage migration). 2.3.2 supports binding `ldp_vc` credentials to a `did:web` holder when `holderDidUrl` is supplied with `bindingPolicy: require` (other requests are unchanged), and adds `Ed25519VerificationKey2020` support; the platform's `did:web` default for `ldp_vc` (#1820) relies on it. In 2.3.2, `credentialSubject.id` of new W3C credentials is the holder's bare DID, and DCQL `ldp_vc` queries must use expanded JSON-LD IRIs in `meta.type_values`. The image name is unchanged in this release: `ghcr.io/credebl/credo-controller:v2.3.2`. The rename to `agent-controller` is deferred upstream.
- Controller 2.3.x adds W3C JSON-LD end-to-end (`ldp_vc` over OID4VC, DCQL verification), X.509 chain support, a tenant session leak fix, and moves its base image to Node 26. Rebuild agent images rather than reusing cached layers.
- Holder list endpoints (SD-JWT, mdoc, W3C) return a plain array with no query parameters, but an envelope `{ data, pagination, filters? }` once any parameter is sent. The platform on `main` does not call these endpoints. Any holder-management work (for example #1792) must handle both shapes.

## Features
- OpenBao secret storage (provider, provisioning script, `docker-compose.openbao.yml`, docs/tests) (#1679, #1712)
- Rust FS / local storage support via `@credebl/storage` (#1670)
- OID4VC: `jwt_vc_json-ld` / `ldp_vc` (JSON-LD) credential format support (#1646)
- OID4VC: holder binding methods (`cryptographic_binding_methods_supported`) are configurable per template and per issuer, and `ldp_vc` advertises `did:web` by default. See `docs/oid4vc-holder-binding-methods.md` (#1820)
- Swagger UIs exposed per module group (#1608)
- API gateway version via `API_GATEWAY_VERSION` env (#1777)
- Row-level security migration `enable_rls_if_not_exists` (#1688)

## Fixes
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
- pnpm security overrides added; pnpm 9.15.9

## Upgrade notes
- Run `prisma migrate deploy`. New migrations: the RLS migration (test on a copy of production data first) and `add_cryptographic_binding_methods_to_oidc_issuer` (adds `oidc_issuer.cryptographicBindingMethods TEXT[] DEFAULT '{}'`, additive, no backfill) (#1820).
- New agent env vars in `agent.env`: `STATUS_LIST_SERVER_URL`, `STATUS_LIST_API_KEY`, `STATUS_LIST_DEFAULT_SIZE`; platform `STATUS_LIST_HOST` in `.env.demo`.
- OpenBao is optional; see `openspec/specs/openbao-secret-storage` and `docker-compose.openbao.yml`.
- Pin the controller image to v2.3.2 (`AFJ_VERSION`).
