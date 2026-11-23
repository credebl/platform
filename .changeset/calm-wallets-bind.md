---
'api-gateway': patch
---

Cloud wallet: bind OID4VC credentials to a DID of the wallet. `POST /v1/oid4vc/holder/request-credential` takes the optional fields `holderDidUrl` (the credentials are bound to that DID's key instead of a new key), `bindingPolicy` (`require`, the default when `holderDidUrl` is set, or `prefer`) and `sendNotification`. `POST /v1/did/import/session` now accepts `key` and `web` as well as `polygon`, so an existing key can be imported as a `did:web`. Creating a cloud wallet no longer fails on agents that run Credo 0.7.
