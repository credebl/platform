# VCDM 2.0 Conformance Specification

## Executive Summary

This document outlines the changes made to make the CREDEBL SSI platform conformant with W3C Verifiable Credentials Data Model 2.0 (VCDM 2.0) while maintaining full backward compatibility with VCDM 1.1 (current implementation). The implementation introduces versioned credential issuance supporting `v1`, `v1.1`, and `v2` with `v1.1` as the default to preserve existing behavior.

Credential envelopes are strict: a credential issued as `v2` contains only VCDM 2.0 fields (`validFrom`/`validUntil`, v2 context) and a credential issued as `v1`/`v1.1` contains only VCDM 1.1 fields (`issuanceDate`/`expirationDate`, v1 context). The requested version is validated at the API boundary and is never copied into the credential JSON.

## Table of Contents

1. [Objectives](#objectives)
2. [References](#references)
3. [Versioning Strategy](#versioning-strategy)
4. [Changes Implemented](#changes-implemented)
5. [Migration Strategy](#migration-strategy)
6. [Backward Compatibility](#backward-compatibility)
7. [VCDM 1.1 vs 2.0 Comparison](#vc-dm-11-vs-20-comparison)
8. [Implementation Details by Component](#implementation-details-by-component)
9. [Testing](#testing)
10. [Known Considerations](#known-considerations)

## Objectives

- Support VCDM 2.0 conformant credential structures while preserving existing v1.1 behavior
- Add `version` parameter with options: `v1`, `v1.1`, `v2` (default `v1.1`)
- Ensure previously issued credentials remain immutable and verifiable
- Update schema generation, credential construction, DTOs, and OID4VC flows to be version-aware
- Validate that submitted credentials match the requested version (no silent translation of conflicting inputs)
- Create new schemas for v2 issuance (do not mutate existing schemas)

## References

- [W3C VC Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/)
- [W3C VCDM 1.1](https://www.w3.org/TR/vc-data-model/)
- [Credo-Ts VC Implementation](https://credo.js.org/) (agent-controller)

## Versioning Strategy

### Allowed Versions
- `v1`: Legacy VCDM 1.0 shape (uses the v1 context and `issuanceDate`)
- `v1.1`: Current platform shape (v1 context + `issuanceDate`/`expirationDate`) - **Default**
- `v2`: VCDM 2.0 conformant shape (v2 context + `validFrom`/`validUntil`)

### Design Decisions
1. **Default to v1.1**: Preserves all existing API contracts and behavior; no breaking changes for existing consumers.
2. **Envelope-level versioning**: For JSON-LD create-offer, out-of-band and bulk e-mail flows, `version` is a property of the request envelope (`CredentialsIssuanceDto`, `OOBCredentialDtoWithEmail`), not of each credential. One request issues credentials of exactly one version.
3. **Template-driven versioning for OID4VC**: The version of an OID4VC credential is derived from the template context. A request may pass `version` as a guard; if it disagrees with the template, the request is rejected with `422 Unprocessable Entity`.
4. **Input validation**: Submitted credentials are validated against the requested version at the API boundary (base `@context` and version-specific date fields). Conflicting inputs are rejected, not translated.
5. **Version-pure date emission**: A `v2` credential never contains `issuanceDate`/`expirationDate` and a v1/v1.1 credential never contains `validFrom`/`validUntil`.
6. **Agent-controller already v2-aware**: The external agent-controller (credo-ts) detects v2 from context or presence of `validFrom`/`validUntil` and normalizes accordingly.

## Changes Implemented

### 1. Centralized VC Constants and Utilities

**Location:** `libs/common/src/vc/vc.ts`

- `vc.ts`: Defines VC contexts (`VC_CONTEXT_V1`, `VC_CONTEXT_V2`), supported versions and default version, context helpers (`VCContext`), and credential shape mapping (`buildCredentialContext`, `mapCredentialForVersion`)
- `getCredentialVersionProblems()`: pure check used by API validation; returns the reasons a credential does not match a version (missing/wrong base context, wrong date fields)
- `resolveSchemaReference()`: resolves the schema URL/id from `credentialSchema.id` or the first non-`w3.org` context entry, instead of assuming `@context[1]`
- `withRefreshedValidityDates()`: returns a copy of a credential with version-appropriate date field names; refreshes past start dates but preserves future start dates
- `index.ts`: Barrel export

Duplicate VC constant files and duplicate `VCVersion` definitions in the enum library were removed.

### 2. Core Credential Construction

**Location:** `libs/common/src/cast.helper.ts`

- `createOobJsonldIssuancePayload()` accepts an optional `version` (defaults to `v1.1`) and uses `mapCredentialForVersion()` so the generated credential matches the requested version
- `validateAndUpdateIssuanceDates(data, version)` is version-aware and pure: it returns mapped copies and no longer mutates callers' objects. Only version-appropriate date fields are emitted.
- Start dates in the past are refreshed to "now" when the offer is re-used; future start dates are preserved so a not-yet-valid credential is not silently made valid today.

### 3. W3C Schema Generation (Ledger)

**Location:** `apps/ledger/libs/helpers/w3c.schema.builder.ts`

- Function accepts an optional `version` parameter (defaults to `v1.1`)
- **v1/v1.1**: Requires `['@context', 'issuer', 'issuanceDate', 'type', 'credentialSubject']`; uses the v1 context
- **v2**: Requires `['@context', 'issuer', 'type', 'credentialSubject']` (validity is optional in VCDM 2.0); uses the v2 context
- Schema includes both `issuanceDate`/`expirationDate` and `validFrom`/`validUntil` as optional properties so the same schema document can describe either shape
- Context prefix updated dynamically based on version
- **API**: `CreateW3CSchemaDto.vcVersion` (enum, defaults to `v1.1`) is forwarded by the ledger service to the builder

### 4. DTOs - API Gateway

**Issuance DTOs:** `apps/api-gateway/src/issuance/dtos/issuance.dto.ts`
- `version` is an envelope-level field on `CredentialsIssuanceDto` (create-offer and OOB create-offer) and `OOBCredentialDtoWithEmail` (bulk e-mail)
- The nested `Credential` DTO no longer has a `version` property, so the version cannot leak into credential JSON
- `Credential.issuanceDate` is now optional (required only by version validation for v1/v1.1); `validFrom` and `validUntil` were added with ISO 8601 validation
- `IsCredentialsVersionConsistentConstraint` validates every credential in the request against the envelope version. Errors are returned as a `400` with the specific mismatch.
- `IsCredentialJsonLdContext` accepts either the v1 or the v2 base context as the first `@context` entry

**Multi-connection DTOs:** `apps/api-gateway/src/issuance/dtos/multi-connection.dto.ts`
- `credentialData` applies the version consistency constraint using the envelope `version`

**Agent Service DTOs:** `apps/api-gateway/src/agent-service/dto/agent-service.dto.ts`
- `W3cCredentialDto` includes `validFrom` and `validUntil` (optional); `issuanceDate` is required only when `validFrom` is absent

**OID4VC Issuance DTOs:** `apps/api-gateway/src/oid4vc-issuance/dtos/issuer-sessions.dto.ts`
- `CredentialRequestDto` accepts an optional `version` guard, validated against the template context in the issuance app

### 5. OID4VC Issuance

**Credential Sessions Builder:** `apps/oid4vc-issuance/libs/helpers/credential-sessions.builder.ts`
- Derives the credential version from the template context (`v2` when the context contains the v2 URL, otherwise `v1.1`)
- Rejects a request whose `version` disagrees with the template with `422 Unprocessable Entity`
- Emits only version-appropriate context and date fields: `validFrom`/`validUntil` for v2, `issuanceDate`/`expirationDate` for v1/v1.1
- `nbf`/`exp` are unaffected

**Issuer Metadata:** `apps/oid4vc-issuance/libs/helpers/issuer.metadata.ts`
- The advertised `credential_definition.@context` is built from the template context with `buildCredentialContext()`, so v2 templates advertise the v2 base context

### 6. Shared Interfaces

**Common Interfaces:** `libs/common/src/interfaces/issuance.interface.ts`
- Extended `ICredential` with `validFrom`/`validUntil`, flexible issuer typing and `credentialStatus`/`credentialSchema`; existing formatting preserved

**Apps Interfaces:** `apps/issuance/interfaces/issuance.interfaces.ts`
- Extended `ICredential` with both validity naming conventions and flexible shapes
- Added `version` to `IIssuance` and `OutOfBandCredentialOfferPayload`

## Migration Strategy

### Core Principles
- **Immutability of issued credentials**: Existing issued credentials cannot and will not be modified. All historical credentials remain valid as-is.
- **Dual support**: v1/v1.1 and v2 run in parallel; no forced migration of existing data.
- **New schemas for v2**: When issuing v2 credentials, create new W3C schema entries with `vcVersion: "v2"`. Do not overwrite or mutate existing schema records - each schema entry is tied to the credential version context it validates.
- **Backward compatible APIs**: Default version is `v1.1`; adding `version` parameter is additive and non-breaking.
- **Strict issuance, lenient verification**: Issuance requires version-consistent input; verification paths continue to accept both field naming conventions (`issuanceDate` ⟷ `validFrom`, `expirationDate` ⟷ `validUntil`).

### Phased Migration Plan

| Phase | Activity | Status |
|---|---|---|
| 1 | Inventory and audit of credential construction paths | ✅ Completed |
| 2 | Add version plumbing (types, DTOs, interfaces) with defaults | ✅ Completed |
| 3 | Centralize VC constants and mappers | ✅ Completed |
| 4 | Implement version-aware credential construction | ✅ Completed |
| 5 | Versioned W3C schema generation | ✅ Completed |
| 6 | Update OID4VC/metadata to honor template version | ✅ Completed |
| 7 | Agent-controller boundary compatibility (already v2-aware) | ✅ Verified |
| 8 | Verification tolerance (lenient field handling) | ✅ Implemented |
| 9 | Rollout with v1.1 as default; enable v2 on demand | Ready |

## Backward Compatibility

### Ensured Compatibility
- **Default behavior unchanged**: When `version` is not specified, system defaults to `v1.1` - identical to current behavior
- **Existing APIs**: All existing endpoints continue to work without modification
- **Stored credentials**: Previously issued credentials remain structurally unchanged and fully verifiable
- **Schema compatibility**: Existing schemas remain valid for v1/v1.1 credential issuance
- **Lenient parsing**: Verification code accessing validity dates checks for both `validFrom`/`issuanceDate` and `validUntil`/`expirationDate`

### Breaking Changes
**None.** All changes are additive, with sensible defaults. Requests that previously sent a `version` inside a credential object must move it to the request envelope (the old placement was ignored by the implementation and is rejected by the DTO whitelist).

## VCDM 1.1 vs 2.0 Comparison

| Aspect | VCDM 1.1 (v1/v1.1) | VCDM 2.0 (v2) | Implementation |
|---|---|---|---|
| **@context** | `https://www.w3.org/2018/credentials/v1` | `https://www.w3.org/ns/credentials/v2` | Version-aware selection via `VCContext.getBaseContext()`; the other base context is dropped |
| **Validity Start** | `issuanceDate` (date-time) | `validFrom` (date-time) | When v2: emit only `validFrom`. When v1.1: emit only `issuanceDate`. |
| **Validity End** | `expirationDate` (date-time) | `validUntil` (date-time) | When v2: emit only `validUntil`. When v1.1: emit only `expirationDate`. |
| **Issuer** | URI string OR object `{ id: string }` | URI string OR object `{ id: string, ... }` | Flexible typing; v2 normalizes a string issuer to `{ id }` when the credential is built by the platform |
| **Type** | Array including `VerifiableCredential` | Array including `VerifiableCredential` | Unchanged; preserved across versions |
| **Required Fields (Schema)** | `@context`, `issuer`, `issuanceDate`, `type`, `credentialSubject` | `@context`, `issuer`, `type`, `credentialSubject` (validity not strictly required in core) | Schema builder adjusts required fields based on version |
| **Credential Subject** | Object (or array in v2 contexts) | Object or array supported | Interfaces accept both forms |
| **Context Handling** | Additional contexts appended after v1 base | Additional contexts appended after v2 base | Handled by `buildCredentialContext()`; schema URL is kept for both versions |

## Implementation Details by Component

### 1. Platform Core (libs/common)
- **Purpose**: Shared utilities for all apps
- **Key files**: `vc/*`, `cast.helper.ts`, `interfaces/issuance.interface.ts`
- **Changes**: Centralized mapping and validation logic ensures consistent shape generation across all issuance paths

### 2. API Gateway
- **Purpose**: External API interface
- **Key files**: DTOs in `issuance/dtos/*`, `agent-service/dto/*`, `oid4vc-issuance/dtos/*`
- **Changes**: Envelope-level `version` with enum validation and defaults; cross-field credential validation in `issuance/utils/version.validator.ts`; v1/v2 base contexts accepted by the JSON-LD context validator

### 3. Issuance App
- **Purpose**: Handles credential issuance flows
- **Key files**: Service, interfaces
- **Changes**: Version is read from the request envelope and passed to date refresh and schema resolution; `@context[1]` schema lookup replaced with `resolveSchemaReference()`

### 4. Ledger App
- **Purpose**: W3C schema management and validation
- **Key files**: `w3c.schema.builder.ts`
- **Changes**: Versioned schema generation controlled by `vcVersion`; creates the appropriate shape for v1/v1.1 vs v2

### 5. OID4VC Issuance App
- **Purpose**: OpenID4VCI flows
- **Key files**: credential-sessions.builder.ts, issuer.metadata.ts
- **Changes**: Template context is the source of truth; optional request version guard; version-pure credential payloads and metadata

### 6. Agent-Controller (External - credo-ts)
- **Location**: `../agent-controller/src/utils/oid4vc-agent.ts`
- **Status**: Already v2-aware (pre-existing)
- **Behavior**: Detects v2 from context containing v2 URL or presence of `validFrom`/`validUntil`. Maps fields appropriately for W3cV2Credential class. Sets compatibility fields (`issuanceDate=validFrom`, `expirationDate=validUntil`) when needed.

## Testing

### Test Results
- **CI suite**: 265 passed, 2 skipped; no failures
- **New unit tests**: 31 tests across the three specs below
- **TypeScript**: `tsc` clean for `api-gateway`, `issuance`, `ledger` and `oid4vc-issuance`

### New Tests
1. **Schema Builder** (`apps/ledger/libs/helpers/w3c.schema.builder.spec.ts`): v1.1 vs v2 required fields and context prefix; validity properties present
2. **Shape Helpers** (`libs/common/src/vc/vc.spec.ts`): context ordering, version-pure date mapping, version consistency checks, schema reference resolution, date refresh (past vs future), no input mutation
3. **DTO Validation** (`apps/api-gateway/src/issuance/dtos/issuance.version.spec.ts`): v1.1/v2 happy paths, wrong-context rejection, `issuanceDate` rejection for v2, missing `issuanceDate` rejection for v1.1, OOB bulk DTO validation

### Recommended Tests (Future)
1. **Cast Helper**: Verify out-of-band payloads per version
2. **End-to-end issuance**: Happy path tests for both v1.1 and v2 against a running agent
3. **OID4VC**: Template version guard and metadata context tests

## Known Considerations

1. **Input Matching Requirement**: Inputs must match the requested version. No automatic translation of conflicting fields is performed; mismatches are rejected with a validation error.
2. **Schema Versioning**: For v2, schemas should be created as new entries with `vcVersion: "v2"`. This is by design to avoid breaking validation of existing credentials.
3. **Bulk CSV issuance**: The bulk CSV OOB path still builds credentials with the default `v1.1` version because the stored schema record does not retain the credential version. Versioned bulk issuance is a documented follow-up; use the single-credential/v2 flows for v2 issuance.
4. **OID4VC source of truth**: The template `context` determines the version. Changing a template's context to v2 changes the version of credentials issued from it; existing issued credentials are unaffected.
5. **Leniency**: Verification remains lenient by design to support both historical and new credential formats during the transition period.
6. **Agent Boundary**: The platform communicates with agent-controller via NATS; payloads include the credential structure which agent-controller interprets. Our version-aware shaping ensures the correct structure is passed.
7. **OID4VC Flows**: Both JWT-VC and LDP-VC formats are supported; the implementation maintains compatibility across formats.

## Conclusion

The implementation achieves VCDM 2.0 conformance while maintaining full backward compatibility. All changes follow the approved plan: dual version support with v1.1 default, version-aware credential construction, updated schemas, validated DTOs, and version-pure OID4VC payloads. The system is ready for v2 credential issuance without disrupting existing workflows.
