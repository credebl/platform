# Cloud-wallet holder binding choice: repo-specific note

This note records how the canonical design in `oid4vc-holder-binding-design.md` is represented in the
`apps/cloud-wallet` Nest microservice. It does not change the canonical contract.

- The cloud-wallet app in this repository is a NATS microservice, not a React application. The
  per-offer choice is implemented as a framework-agnostic state/validation/payload model in
  `apps/cloud-wallet/src/oid4vc-holder-binding/`, plus the request helper in
  `apps/cloud-wallet/src/oid4vc-holder.helper.ts`. Studio renders the same labels and ordering.
- Labels and order are fixed: **Use a fresh key — recommended** (selected by default), then
  **Use an existing DID**, with **Advanced** controls only on the fresh-key option.
- A platform primary DID is fetched from `GET /orgs/:orgId/users/:userId/oid4vc/holder/primary-did`
  and only offered inside the existing-DID option with the badge `suggested`. It is never a
  default/required badge, and selecting a fresh key omits both flat and nested `holderDidUrl`.
- `withHolderBinding()` keeps the legacy flat `holderDidUrl`/`bindingPolicy` flow for existing
  callers. A nested `binding` object is normalized once and forwarded unchanged; conflicting flat
  and nested DID values are rejected before any offer/tx code is redeemed.
- Validation errors use the stable codes from spec section 8 and are surfaced by
  `CloudWalletService.requestCredential` as HTTP 400 before the agent call. Submit is disabled
  (`canSubmit === false`) while validation is pending or the selection is unsupported.
- Known integration dependency (outside this app's scope): the api-gateway `RequestCredentialDto`
  must accept the additive `binding` object. The gateway's global `ValidationPipe` uses
  `whitelist: true`, so an unchanged DTO strips the field before it reaches cloud-wallet. Studio
  and platform PRs own that DTO/preference-endpoint wiring.
