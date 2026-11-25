---
'api-gateway': patch
---

Cloud wallet: add a per-offer holder binding choice to OID4VC credential requests. A fresh key is the default; an existing holder DID is opt-in and submits a nested `binding` payload (`new-key` or `existing-did`) instead of relying on the flat `holderDidUrl` field. The primary DID is only suggested inside the existing-DID option, advanced method/algorithm controls are narrowed by issuer metadata and wallet/KMS capabilities, and invalid choices are rejected before offer redemption.
