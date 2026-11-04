# OID4VCI holder binding methods

`cryptographic_binding_methods_supported` in the issuer metadata tells a wallet which key types and DID methods it may use to bind an issued credential to itself (proof of possession). Credo's holder enforces this list, so a `did:web` wallet only gets a credential bound to its DID if the issuer advertises `did:web`.

## Allowed values

`jwk`, `did:key`, `did:web`, `did:jwk`, `did:indy`, `did:sov`, `did:cheqd`, `did:webvh`, `did:polygon` (`SUPPORTED_HOLDER_BINDING_METHODS` in `libs/enum/src/enum.ts`). `did:peer` is not offered because the issuer cannot resolve it publicly. The issuer agent must have the matching DID resolver registered (for example the polygon plugin for `did:polygon`).

## Resolution order (per credential configuration)

1. `template.cryptographicBindingMethods` on the credential template (`dc+sd-jwt`, `jwt_vc_json-ld`, `ldp_vc`).
2. `cryptographicBindingMethods` on the issuer (create/update issuer API).
3. Per-format default: `dc+sd-jwt` and `jwt_vc_json-ld` use `did:key, did:web, did:jwk, jwk`; `ldp_vc` uses `did:key, did:web`.

`mso_mdoc` is always `jwk`.

An empty or omitted list means "no override at this level". Updating an issuer re-pushes the issuer configuration to the agent, so a changed issuer default takes effect immediately. A changed template list is pushed on template create/update.

## Upgrade notes

- Database: migration `add_cryptographic_binding_methods_to_oidc_issuer` adds an additive `oidc_issuer.cryptographicBindingMethods TEXT[]` column (default empty). Run `prisma migrate deploy`. No data backfill is needed and existing issuers behave as before.
- API: new optional `cryptographicBindingMethods` on issuer create/update and on the template body.
- Behaviour change: `ldp_vc` configurations now advertise `did:web` in addition to `did:key` by default.
