import {
  Oid4vciNotificationEvent,
  Oid4vciSessionNotification,
  Oid4vciSessionNotificationEvent
} from '../../interfaces/oid4vc-wh-interfaces';

const NOTIFICATION_EVENTS: readonly string[] = ['credential_accepted', 'credential_failure', 'credential_deleted'];

export interface SanitizedNotificationHistory {
  history: Oid4vciSessionNotification[];
  // Entries and events left out because they do not have the expected shape
  skipped: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return 'object' === typeof value && null !== value && !Array.isArray(value);
}

function sanitizeEvent(value: unknown): Oid4vciSessionNotificationEvent | undefined {
  if (
    !isRecord(value) ||
    'string' !== typeof value.event ||
    !NOTIFICATION_EVENTS.includes(value.event) ||
    'string' !== typeof value.receivedAt ||
    Number.isNaN(Date.parse(value.receivedAt))
  ) {
    return undefined;
  }
  return {
    event: value.event as Oid4vciNotificationEvent,
    ...('string' === typeof value.eventDescription ? { eventDescription: value.eventDescription } : {}),
    receivedAt: value.receivedAt
  };
}

/**
 * Keeps the entries and events of a notification history that have the expected shape.
 * The gateway accepts the history as is, so a change in the agent's format cannot reject state-change webhooks;
 * this is where it is checked before it is stored.
 */
export function sanitizeNotificationHistory(value: unknown): SanitizedNotificationHistory {
  if (!Array.isArray(value)) {
    return { history: [], skipped: null === value || value === undefined ? 0 : 1 };
  }

  let skipped = 0;
  const history: Oid4vciSessionNotification[] = [];
  for (const entry of value) {
    if (!isRecord(entry) || 'string' !== typeof entry.notificationId || !entry.notificationId) {
      skipped += 1;
      continue;
    }
    const rawEvents = Array.isArray(entry.events) ? entry.events : [];
    if (!Array.isArray(entry.events)) {
      skipped += 1;
    }
    const events = rawEvents.map(sanitizeEvent).filter((event) => event !== undefined);
    skipped += rawEvents.length - events.length;
    history.push({
      notificationId: entry.notificationId,
      ...('string' === typeof entry.credentialConfigurationId
        ? { credentialConfigurationId: entry.credentialConfigurationId }
        : {}),
      events
    });
  }
  return { history, skipped };
}

/**
 * Merges the notification history the agent sent with the one already stored. Both must be sanitized.
 * Webhooks for notifications received close together can arrive out of order, so an older snapshot
 * must not drop events a newer one already stored. Events are keyed by notificationId, event and receivedAt.
 */
export function mergeNotificationHistory(
  stored: Oid4vciSessionNotification[],
  incoming: Oid4vciSessionNotification[]
): Oid4vciSessionNotification[] {
  const merged = new Map<string, Oid4vciSessionNotification>();

  for (const notification of [...stored, ...incoming]) {
    const existing = merged.get(notification.notificationId);
    const seen = new Set<string>();
    const uniqueEvents = [...(existing?.events ?? []), ...notification.events].filter((event) => {
      const key = `${event.event}|${Date.parse(event.receivedAt)}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    uniqueEvents.sort((a, b) => Date.parse(a.receivedAt) - Date.parse(b.receivedAt));

    merged.set(notification.notificationId, {
      ...existing,
      ...notification,
      events: uniqueEvents
    });
  }

  return [...merged.values()];
}
