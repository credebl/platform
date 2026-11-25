# OID4VC holder binding choice: design specification

Status: proposed for implementation across agent-controller, platform, cloud-wallet, and studio.

## 1. Problem

OID4VC credential requests currently have two binding paths:

1. Caller supplies `holderDidUrl` -> agent-controller binds the credential to that DID.
2. Caller omits `holderDidUrl` -> agent-controller creates a fresh key/DID via `createNewKeyBinding()` and binds the credential to it.

The fresh-key path has three defects:

- It selects the first issuer-supported JWA algorithm in wallet JWA order; with issuer metadata such as `Person SD-JWT-sdjwt` (`ES256, EdDSA, RS256`) this selects `RS256`.
- It hardcodes `backend: 'askar'`; Askar cannot create RSA keys, producing:
  `Key management service backend 'askar' does not support 'createKey' operation with kty 'RSA' and bit length '2048'`.
- The holder has no per-offer control over whether a stable DID or a fresh unlinkable key is used.

A platform-marked "primary DID" can improve UX, but must never be silently used because reusing one DID across issuers creates correlation and harms privacy.

## 2. Goals

- Fix RSA/Askar failure in no-DID new-key binding.
- Make `holderDidUrl` optional and holder-controlled.
- Give the holder a per-offer choice:
  - fresh key (default, privacy-preserving)
  - existing DID (explicit opt-in)
  - advanced selection of DID method and proof key algorithm when creating a fresh key
- Let platform store a primary DID as a pre-fill/default suggestion, not a forced binding.
- Preserve backward compatibility with existing flat `holderDidUrl` and `bindingPolicy` fields.
- Keep RS256 advertised in issuer metadata so RSA holder keys (for example DSC-backed `did:web`) continue to work.

## 3. Non-goals

- No agent-controller concept of "primary", "default", or platform user identity.
- No change to issuer signing keys or certificate flows.
- No change to OID4VP verification.
- No breaking change to existing credential offer creation APIs.
- No removal of `RS256` from `HOLDER_PROOF_ALGS_FOR_JWT`.

## 4. Terminology

- **Fresh key binding**: a new key pair and DID/JWK generated for one credential offer; privacy-preserving and unlinkable by default.
- **Existing DID binding**: credential subject/proof bound to a DID already controlled by the holder tenant.
- **Primary DID**: a platform-side preference indicating the DID to pre-fill in UI; agent-controller is unaware of the term.
- **DID method choice**: `did:key`, `did:jwk`, `did:web`, etc., constrained by issuer metadata and wallet resolvers/registrars.
- **Proof algorithm choice**: JWA algorithm used for the JWT proof of possession, e.g. `EdDSA`, `ES256`, `RS256`.

## 5. API contract

### 5.1 Agent-controller `POST /openid4vc/holder/request-credential`

Existing fields remain valid:

```json
{
  "credentialOfferUri": "...",
  "credentialsToRequest": ["..."],
  "txCode": "1234",
  "holderDidUrl": "did:key:z6Mk...#key-1",
  "bindingPolicy": "require",
  "sendNotification": true
}
```

New optional field (additive):

```json
{
  "binding": {
    "mode": "new-key",
    "didMethod": "did:jwk",
    "signatureAlgorithm": "EdDSA"
  }
}
```

Existing-DID form:

```json
{
  "binding": {
    "mode": "existing-did",
    "holderDidUrl": "did:web:holder.example.com#key-1",
    "policy": "require"
  }
}
```

Schema:

```ts
export type CredentialBindingMode = 'new-key' | 'existing-did'
export type CredentialBindingPolicy = 'require' | 'prefer'

export interface CredentialBindingOptions {
  mode: CredentialBindingMode
  holderDidUrl?: string
  policy?: CredentialBindingPolicy
  didMethod?: string
  signatureAlgorithm?: string
}
```

Validation rules:

- If `binding.mode === 'existing-did'`, `binding.holderDidUrl` is required.
- If `binding.mode === 'new-key'`, `binding.holderDidUrl` must be absent.
- `binding.didMethod` and `binding.signatureAlgorithm` are only valid for `new-key`.
- Flat `holderDidUrl` is equivalent to `binding.mode === 'existing-did'`.
- Supplying both flat and nested forms is accepted only when they agree; conflicting values are rejected with HTTP 400.
- `didMethod` must be one advertised by the issuer config(s), or `supportsAllDidMethods`.
- `signatureAlgorithm` must be in the issuer's `proof_types_supported.jwt.proof_signing_alg_values_supported` and supported by the wallet KMS.
- For `mso_mdoc`, `existing-did` is rejected; fresh JWK binding remains allowed.
- For W3C `ldp_vc`, fresh JWK/plain-JWK binding is rejected by Credo; use DID method `did:key` or `did:jwk`.
- Validation occurs before token redemption so no offer/tx code is consumed on a user-input error.

### 5.2 Platform `POST /oid4vc/holder/request-credential`

Platform DTO mirrors the agent-controller `binding` object and forwards it unchanged after authorization and validation.

Platform also exposes primary DID preference APIs:

- `GET /orgs/:orgId/users/:userId/oid4vc/holder/primary-did` -> preference or 204
- `PUT /orgs/:orgId/users/:userId/oid4vc/holder/primary-did` with body `{ didUrl, holderTenantId }`
- `DELETE /orgs/:orgId/users/:userId/oid4vc/holder/primary-did`

Platform must verify the DID is present in the holder tenant before saving it.

## 6. Selection algorithm

### 6.1 Existing DID mode

1. Resolve `holderDidUrl` in holder tenant.
2. Verify issuer supports DID method and proof algorithm.
3. If `policy === 'require'`, fail on mismatch.
4. If `policy === 'prefer'`, fall back to fresh-key binding on mismatch.
5. Sign proof with the resolved verification method.
6. For W3C credentials, verify `credentialSubject.id` matches the DID.

### 6.2 Fresh key mode

1. Resolve offered credential configurations and their binding methods/proof algorithms.
2. Determine DID method:
   - caller override `binding.didMethod` if valid
   - otherwise current preference: `did:jwk` if supported, then `did:key`, otherwise JWK/plain fallback, then `did:key` default when nothing is advertised
3. Determine proof algorithm:
   - caller override `binding.signatureAlgorithm` if valid
   - otherwise current wallet-order first algorithm after excluding algorithms whose key type cannot be created by any registered KMS backend
   - preferred implicit order for new keys: `EdDSA`, `ES256`, `ES384`, `ES512`, `RS256`, `PS256`
4. Choose KMS backend:
   - no hard-coded `askar`
   - let Credo implicit fallback select Askar for EC/OKP and Node KMS for RSA/P-521
   - if explicit backend is needed, use `selectKmsBackendForCreate()` from `utils/kms/backend.ts`
5. Create key, then create `did:jwk`/`did:key` or return plain JWK as allowed by format.
6. If key creation fails for the selected algorithm, do not silently retry with a different algorithm unless caller allowed automatic fallback.

### 6.3 Platform primary DID

- Platform may pre-fill primary DID in UI.
- Fresh key remains the default selected option.
- Platform must not add `holderDidUrl` when user selects fresh key.
- Platform may add `holderDidUrl` when user explicitly selects existing DID.

## 7. Privacy requirements

- No silent DID reuse across offers/issuers.
- Fresh key option must be first/default in UI.
- Existing DID option requires explicit user action.
- Logs must not include full DID lists, proof JWTs, tx codes, or private key material. DID method/key type and error codes may be logged.

## 8. Error taxonomy

All validation errors are HTTP 400 with stable messages where practical:

- `INVALID_BINDING_MODE`
- `MISSING_HOLDER_DID_URL`
- `CONFLICTING_HOLDER_DID_URL`
- `UNSUPPORTED_DID_METHOD`
- `UNSUPPORTED_PROOF_ALGORITHM`
- `INCOMPATIBLE_DID_METHOD_AND_ALGORITHM`
- `DID_BINDING_NOT_SUPPORTED_FOR_FORMAT`
- `DID_NOT_CONTROLLED_BY_HOLDER_TENANT`
- `PRIMARY_DID_NOT_FOUND`
- `KEY_CREATION_FAILED`

Runtime failures after token redemption remain HTTP 500 with sanitized upstream error mapping.

## 9. UI requirements

### Studio and cloud wallet

For each incoming offer, display:

1. **Use a fresh key — recommended** (default)
   - optional advanced controls: DID method and proof algorithm
   - options populated from issuer metadata and wallet capabilities
2. **Use an existing DID**
   - list of holder DIDs
   - platform primary DID pre-selected if available
   - policy selector require/prefer (require default)
3. Confirmation summary before submit.

Primary DID badge must say "suggested", not "default" or "required".

## 10. Test matrix

### Positive: fresh key (P-FK)

- **P-FK-01** no binding field, issuer SD-JWT `ES256, EdDSA, RS256` -> fresh key, issuance succeeds (RS256 no longer crashes).
- **P-FK-02** `binding.mode='new-key'`, no overrides -> fresh key, auto method/algorithm.
- **P-FK-03** `didMethod='did:key'`, `signatureAlgorithm='EdDSA'` -> Ed25519 DID key created.
- **P-FK-04** `didMethod='did:jwk'`, `signatureAlgorithm='ES256'` -> P-256 DID JWK created.
- **P-FK-05** `didMethod='did:jwk'`, `signatureAlgorithm='RS256'` -> RSA key created in Node KMS, DID JWK created, issuance succeeds.
- **P-FK-06** `signatureAlgorithm='ES256'` only -> auto DID method.
- **P-FK-07** issuer supports all DID methods -> `did:jwk` preferred.
- **P-FK-08** issuer advertises only `did:key` -> `did:key` used.
- **P-FK-09** issuer advertises no binding methods -> default `did:key` used for SD-JWT/JWT VC.
- **P-FK-10** batch offer with 2 credentials -> single fresh key used and both credentials issued.
- **P-FK-11** `sendNotification=true` -> `credential_accepted` notification sent.
- **P-FK-12** `sendNotification=false` -> credential stored, no notification.
- **P-FK-13** mso_mdoc fresh JWK binding -> succeeds with ES256.
- **P-FK-14** ldp_vc fresh did:key with EdDSA -> succeeds.
- **P-FK-15** OpenBao configured and supports algorithm -> OpenBao backend selected.
- **P-FK-16** primary DID exists but user chooses fresh key -> request omits `holderDidUrl`.

### Positive: existing DID (P-ED)

- **P-ED-01** flat `holderDidUrl` -> backward-compatible binding.
- **P-ED-02** nested `binding.mode='existing-did'` -> binds to supplied DID.
- **P-ED-03** bare DID -> first authentication key used.
- **P-ED-04** DID URL with fragment -> exact verification method used.
- **P-ED-05** `did:key` + EdDSA -> succeeds.
- **P-ED-06** `did:jwk` + ES256 -> succeeds.
- **P-ED-07** `did:web` + RS256 with RSA key in Node KMS -> succeeds when issuer supports did:web and RS256.
- **P-ED-08** `policy='prefer'` with unsupported DID method -> falls back to fresh key and succeeds.
- **P-ED-09** W3C LDP VC binds credential subject to requested DID.
- **P-ED-10** SD-JWT proof uses DID verification method.
- **P-ED-11** platform primary DID pre-filled, user confirms existing DID -> sent as `holderDidUrl`.
- **P-ED-12** existing DID from another tenant is rejected before token request.

### Positive: platform/UI (P-UI)

- **P-UI-01** primary DID GET returns saved preference.
- **P-UI-02** primary DID PUT validates DID belongs to holder tenant.
- **P-UI-03** primary DID DELETE clears preference.
- **P-UI-04** fresh key is visually default even when primary exists.
- **P-UI-05** advanced controls only show methods/algorithms allowed by metadata.
- **P-UI-06** offer summary shows selected binding before submit.
- **P-UI-07** studio and cloud-wallet render same labels and ordering.
- **P-UI-08** disabled submit while validating unsupported selection.

### Negative: validation (N-V)

- **N-V-01** `binding.mode='bogus'` -> 400 INVALID_BINDING_MODE.
- **N-V-02** existing-did without `holderDidUrl` -> 400 MISSING_HOLDER_DID_URL.
- **N-V-03** flat and nested DIDs differ -> 400 CONFLICTING_HOLDER_DID_URL.
- **N-V-04** `didMethod` supplied in existing-did mode -> 400.
- **N-V-05** `signatureAlgorithm` supplied in existing-did mode -> 400.
- **N-V-06** `holderDidUrl` supplied in new-key mode -> 400.
- **N-V-07** unsupported DID method -> 400 UNSUPPORTED_DID_METHOD.
- **N-V-08** unsupported signature algorithm -> 400 UNSUPPORTED_PROOF_ALGORITHM.
- **N-V-09** `did:key` + RSA algorithm -> 400 INCOMPATIBLE_DID_METHOD_AND_ALGORITHM.
- **N-V-10** existing DID for mso_mdoc -> 400 DID_BINDING_NOT_SUPPORTED_FOR_FORMAT.
- **N-V-11** plain JWK fresh binding for ldp_vc -> 400 (Credo format rule).
- **N-V-12** DID URL with unknown fragment -> 400 DID_NOT_CONTROLLED_BY_HOLDER_TENANT.
- **N-V-13** malformed DID -> 400.
- **N-V-14** empty `credentialsToRequest` -> 400.
- **N-V-15** requested credential not in offer -> 400 before token.
- **N-V-16** primary DID PUT with DID not in holder tenant -> 400 PRIMARY_DID_NOT_FOUND.
- **N-V-17** primary DID PUT by user without holder access -> 403.
- **N-V-18** binding override for one credential only in a multi-credential offer with incompatible formats -> 400 before token.

### Negative: runtime/KMS (N-R)

- **N-R-01** wallet has no KMS backend supporting selected algorithm -> 400/422 before token if discoverable; otherwise 500 KEY_CREATION_FAILED.
- **N-R-02** RSA selected with only Askar registered -> clear KEY_CREATION_FAILED (no silent downgrade).
- **N-R-03** Node KMS sign fails after key creation -> 500, no credential stored.
- **N-R-04** DID creation fails after key creation -> 500, key remains orphaned but no credential stored.
- **N-R-05** offer expired/spent -> 400/409 and original "offer already used/expired/withdrawn" message.
- **N-R-06** wrong tx code -> 401/400 from token endpoint; no credential issued.
- **N-R-07** issuer metadata fetch fails -> 500/502 before binding selection.
- **N-R-08** notification endpoint fails -> credential still stored; failure reported in notification result only.
- **N-R-09** wallet DID resolver unavailable for did:web -> 400 UNSUPPORTED_DID_METHOD (or 422 resolvability failure) before token.
- **N-R-10** credential storage fails after issuance -> structured error; issuer notified `credential_failure`.

### Negative: privacy/UX (N-P)

- **N-P-01** no request includes primary DID unless user selects existing DID.
- **N-P-02** logs contain no txCode, proof JWT, or private JWK.
- **N-P-03** UI does not label primary DID as required.
- **N-P-04** all fresh-key requests create a new key id distinct from previous offers.
- **N-P-05** changing primary DID does not retroactively rebind stored credentials.

## 11. Backward compatibility

- Flat `holderDidUrl` continues to work exactly as before.
- Existing `bindingPolicy` semantics unchanged.
- No migration required for existing credentials.
- Agent-controller callers that omit all binding fields keep working, but now use fixed backend selection.

## 12. Rollout

1. Merge agent-controller first; deploy to local/dev.
2. Merge platform API changes; deploy.
3. Merge cloud-wallet and studio UIs; deploy.
4. Replay Person SD-JWT no-DID reproduction and verify success.
5. Verify primary DID flows and privacy checks.

## 13. PR ownership

- agent-controller: API, resolver, backend fix, unit tests, canonical spec.
- platform: DTO forwarding, primary DID preference API/data model, tests, spec copy.
- cloud-wallet: per-offer binding UI in `apps/cloud-wallet`, tests, spec copy.
- studio: holder offer redemption UI/API wrapper, tests, spec copy.
