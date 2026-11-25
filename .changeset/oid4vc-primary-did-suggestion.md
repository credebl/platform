---
'api-gateway': minor
---

OID4VC holder binding choice: the request-credential API accepts an optional `binding` object (`new-key` with optional `didMethod`/`signatureAlgorithm`, or `existing-did` with `holderDidUrl`/`policy`) and forwards it unchanged to the agent. Flat `holderDidUrl`/`bindingPolicy` remain supported.

Added `GET/PUT/DELETE /orgs/:orgId/users/:userId/oid4vc/holder/primary-did` for a holder-tenant-scoped primary DID suggestion. The suggestion is a UI pre-fill only and is never injected into a credential request; fresh-key binding remains the default.
