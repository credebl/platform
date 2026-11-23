# OID4VC revocation handling

Credential revocation is controlled by our platform and Agent Controller, not by Credo. Credo stores `issuanceMetadata` opaquely and signs whatever status data is placed in each credential. No Credo change is required.

## Current state

- Credential templates store `canBeRevoked` (`credential_templates.canBeRevoked`, default `false`).
- Credential offers use one common `isRevocable` flag.
- The offer DTO currently defaults `isRevocable` to `false`, so an omitted value and an explicit `false` cannot be distinguished.
- Platform allocates status lists only when the common offer flag is `true`.
- Agent Controller also checks the common flag, then injects `status` for SD-JWT and `credentialStatus` for JSON-LD credentials.
- D2A has no template reference and keeps its existing global-flag behavior.
- mdoc revocation is not covered by this document.

## Key findings

- Template `canBeRevoked: false` with offer `isRevocable: true` currently produces a revocable credential.
- Template `canBeRevoked: true` with `isRevocable` omitted currently produces a non-revocable credential.
- Mixed offers are all-or-nothing based on the common flag.
- Session revocation revokes every status-list entry in the session.

## Omitted vs false

| Input | Meaning |
| --- | --- |
| Omitted | No explicit offer value; use the template configuration |
| `false` | Explicitly disable revocation |
| `true` | Explicitly enable revocation |

The DTO default must be removed so omitted becomes `undefined` and can be differentiated from `false`.

## Planned rule

Strict consistency:

- `canBeRevoked` is the source of truth.
- If `isRevocable` is omitted, derive it from the templates.
- If `isRevocable` is provided, it must match the derived value.
- Any mismatch returns `400 Bad Request`.
- Mixed template settings in one offer return `400`.

Derived value:

- All templates `true` -> `true`.
- All templates `false` -> `false`.
- Mixed `true`/`false` -> error.

## Scenario matrix

| Template `canBeRevoked` | Offer `isRevocable` | Result |
| --- | --- | --- |
| `true` | omitted | Revocable |
| `true` | `true` | Revocable |
| `true` | `false` | `400 Bad Request` |
| `false` | omitted | Not revocable |
| `false` | `false` | Not revocable |
| `false` | `true` | `400 Bad Request` |
| Mixed | omitted | `400 Bad Request` |
| Mixed | `true` | `400 Bad Request` |
| Mixed | `false` | `400 Bad Request` |

The same validation applies in reverse: an explicit offer value that conflicts with the template-derived value is always rejected.

## Implementation summary

Platform:

- Remove the `isRevocable = false` default from the standard create-offer DTO.
- Resolve revocation per credential from `canBeRevoked`.
- Reject conflicts and mixed offers.
- Allocate status lists only for revocable credentials.
- Leave D2A unchanged.

Agent Controller:

- Add per-credential `isRevocable`.
- Use `cred.isRevocable ?? options.isRevocable` for backward compatibility.
- Keep `issuanceMetadata.isRevocable` for compatibility, but do not use it as the decision source.
- Add status-list information only for revocable credentials.

Credo:

- No changes.
- No database migration.
- Deploy Agent Controller before Platform so older platform requests keep working during rollout.

If mixed offers become a requirement, the API and revocation flow must move to explicit per-credential revocation semantics.
