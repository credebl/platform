# OID4VCI wallet notifications

With OID4VCI 1.0 (section 11), a wallet can tell the issuer what it did with a credential it received. It sends the event to the issuer's `notification_endpoint`, using the `notification_id` from the credential response. CREDEBL relays these notifications to the organization's webhook. This gives the issuing organization an acknowledgement after the wallet stores the credential.

| Event | Meaning |
|---|---|
| `credential_accepted` | The wallet stored the credential. |
| `credential_failure` | The wallet could not store the credential, for example because it failed to verify it. |
| `credential_deleted` | The holder deleted the credential from the wallet. |

A notification does not change the issuance session's state; the session stays `Completed`. OID4VCI has no notification for a wallet that declines an offer before issuance.

## Requirements

- **Issuer agent:** an agent-controller whose issuer serves the notification endpoint and reports notifications on its `openid4vc-issuance` webhook. It needs the Credo issuer notification endpoint (openwallet-foundation/credo-ts#3215). With an older agent, webhooks carry no notification fields and nothing changes.
- **Wallet:** the wallet must send notifications. Wallets are not required to; a wallet that never sends them produces no acknowledgement.
- **Organization:** a webhook URL registered for the organization. It's signed with the organization's webhook secret when one is set, like every other webhook.

## Webhook payload

Notifications use the existing issuance webhook; there is no new topic. CREDEBL POSTs `{ "data": { ... } }` to the organization's webhook URL. **A post is a wallet notification if and only if `data.notification` is present.** The other fields are the same as in state-change posts.

```json
{
  "data": {
    "id": "5f0c2a7e-1b7e-4d0b-9a49-1d1a0c3e9b11",
    "credentialOfferId": "a3c8e1d2-...",
    "issuedCredentials": [],
    "credentialOfferPayload": { "credential_configuration_ids": ["EmployeeBadge-sdjwt"] },
    "state": "Completed",
    "createdAt": "2026-11-12T10:00:00.000Z",
    "updatedAt": "2026-11-12T10:00:06.120Z",
    "contextCorrelationId": "6b1f...",
    "issuerId": "issuer-public-id",
    "notification": {
      "notificationId": "8c7d4f0e-...",
      "credentialConfigurationId": "EmployeeBadge-sdjwt",
      "event": "credential_accepted",
      "receivedAt": "2026-11-12T10:00:06.118Z"
    },
    "notifications": [
      {
        "notificationId": "8c7d4f0e-...",
        "credentialConfigurationId": "EmployeeBadge-sdjwt",
        "events": [{ "event": "credential_accepted", "receivedAt": "2026-11-12T10:00:06.118Z" }]
      }
    ]
  }
}
```

- **`data.notification`:** the event just received. `eventDescription` is present only when the wallet sent one. To match it to the offer, use `data.id` (the issuance session id returned when the offer was created) and `notification.credentialConfigurationId`. There is one `notificationId` per credential configuration in the session.
- **Repeated events:** a `notificationId` can receive more than one event over time, for example `credential_accepted` and later `credential_deleted`. Each event arrives as its own post.
- **`data.notifications`:** the session's notification history so far. It also appears on ordinary state-change posts once credentials are issued, with empty `events`. Decide whether a post is a notification by `notification`, not by `notifications`.

## Validation

The issuer agent sends the history (`notifications`) on every webhook after issuance. That includes state-change webhooks such as the one for `Completed`. CREDEBL therefore validates the two fields differently, so that a change in the history's format can't make it reject state changes:

| Field | At the API gateway | Stored | Forwarded to the organization |
|---|---|---|---|
| `notification` | Validated: `notificationId` (string), optional `credentialConfigurationId` and `eventDescription` (strings), `event` (one of the three events above), `receivedAt` (ISO 8601). An invalid notification is rejected with `400`. | No; it is part of the history. | Yes, as validated. |
| `notifications` | Accepted as is, in any shape. | Only well-formed entries and events (the same rules as above); the rest is left out and logged as a warning by the `oid4vc-issuance` service (`Ignored N malformed notification history item(s) ...`). | Yes, unchanged. |

So a webhook is never rejected because of its notification history. If the history format changes, state changes are still stored and relayed. Only the stored history misses the entries CREDEBL doesn't recognize, and the warning log shows it.

## Storage and retrieval

- **Database:** the history is stored on the issuance session's `oid4vc_credentials` row, in the `notifications` column (jsonb, nullable). Each webhook's history is merged with the stored one, not written over it. Events are de-duplicated by `notificationId`, `event` and `receivedAt`, and ordered by `receivedAt`. A per-session database lock serializes the merge, so webhooks that arrive together or out of order cannot drop events.
- **API:** `GET /v1/orgs/{orgId}/oid4vc/credential-offer/{id}` and `GET /v1/orgs/{orgId}/oid4vc/credential-offer` return the agent's issuance session record, so they include `notifications` once the agent supports them.

## Upgrade notes

- **Database:** migration `add_notifications_to_oid4vc_credentials` adds the nullable `oid4vc_credentials.notifications` jsonb column. It's additive, with no backfill; run `prisma migrate deploy`.
- **API:** the webhook accepts two new optional fields. Older agents keep working unchanged.
- **Organization webhook consumers:** expect posts that carry `data.notification` and the same `state` as the previous post. Don't treat them as state changes.
