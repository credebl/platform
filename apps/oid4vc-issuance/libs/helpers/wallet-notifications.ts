import { Oid4vciSessionNotification } from '../../interfaces/oid4vc-wh-interfaces';

/**
 * Merges the notification history the agent sent with the one already stored.
 * Webhooks for notifications received close together can arrive out of order, so an older snapshot
 * must not drop events a newer one already stored. Events are keyed by notificationId, event and receivedAt.
 */
export function mergeNotificationHistory(
  stored: Oid4vciSessionNotification[] | null | undefined,
  incoming: Oid4vciSessionNotification[]
): Oid4vciSessionNotification[] {
  const merged = new Map<string, Oid4vciSessionNotification>();

  for (const notification of [...(Array.isArray(stored) ? stored : []), ...incoming]) {
    if (!notification?.notificationId) {
      continue;
    }
    const existing = merged.get(notification.notificationId);
    const seen = new Set<string>();
    const uniqueEvents = [
      ...(existing?.events ?? []),
      ...(Array.isArray(notification.events) ? notification.events : [])
    ].filter((event) => {
      if (!event?.event || !event.receivedAt) {
        return false;
      }
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
