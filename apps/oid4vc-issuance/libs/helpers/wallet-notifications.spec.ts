import { Oid4vciSessionNotification } from '../../interfaces/oid4vc-wh-interfaces';
import { mergeNotificationHistory, sanitizeNotificationHistory } from './wallet-notifications';

describe('mergeNotificationHistory', () => {
  const accepted = { event: 'credential_accepted' as const, receivedAt: '2026-11-03T10:00:06.000Z' };
  const deleted = { event: 'credential_deleted' as const, receivedAt: '2026-11-03T11:00:00.000Z' };
  const failure = { event: 'credential_failure' as const, receivedAt: '2026-11-03T10:00:07.000Z' };

  function notification(
    notificationId: string,
    events: Oid4vciSessionNotification['events']
  ): Oid4vciSessionNotification {
    return { notificationId, credentialConfigurationId: 'NotifSdJwt', events };
  }

  it('takes the incoming history when nothing is stored', () => {
    const incoming = [notification('notif-1', [accepted])];
    expect(mergeNotificationHistory([], incoming)).toEqual(incoming);
  });

  it('adds new events without duplicating stored ones', () => {
    const stored = [notification('notif-1', [accepted])];
    const incoming = [notification('notif-1', [accepted, deleted])];
    expect(mergeNotificationHistory(stored, incoming)).toEqual([notification('notif-1', [accepted, deleted])]);
  });

  it('keeps stored events when an older snapshot arrives late', () => {
    const stored = [notification('notif-1', [accepted, deleted]), notification('notif-2', [failure])];
    const olderSnapshot = [notification('notif-1', [accepted]), notification('notif-2', [])];
    expect(mergeNotificationHistory(stored, olderSnapshot)).toEqual(stored);
  });

  it('orders events by the time the issuer received them', () => {
    const stored = [notification('notif-1', [deleted])];
    const incoming = [notification('notif-1', [failure, accepted])];
    expect(mergeNotificationHistory(stored, incoming)).toEqual([notification('notif-1', [accepted, failure, deleted])]);
  });

  it('orders events by time, not by how the timestamp is written', () => {
    const atSecond = { event: 'credential_accepted' as const, receivedAt: '2026-11-03T10:00:06Z' };
    const later = { event: 'credential_deleted' as const, receivedAt: '2026-11-03T10:00:06.100Z' };
    const earlierInOffset = { event: 'credential_failure' as const, receivedAt: '2026-11-03T11:00:05+01:00' };
    const merged = mergeNotificationHistory([], [notification('notif-1', [later, atSecond, earlierInOffset])]);
    expect(merged).toEqual([notification('notif-1', [earlierInOffset, atSecond, later])]);
  });

  it('treats the same time written differently as one event', () => {
    const sameTime = { ...accepted, receivedAt: '2026-11-03T10:00:06Z' };
    expect(
      mergeNotificationHistory([notification('notif-1', [accepted])], [notification('notif-1', [sameTime])])
    ).toEqual([notification('notif-1', [accepted])]);
  });
});

describe('sanitizeNotificationHistory', () => {
  const accepted = { event: 'credential_accepted', receivedAt: '2026-11-03T10:00:06.000Z' };

  it('keeps a well-formed history as is', () => {
    const history = [{ notificationId: 'notif-1', credentialConfigurationId: 'NotifSdJwt', events: [accepted] }];
    expect(sanitizeNotificationHistory(history)).toEqual({ history, skipped: 0 });
  });

  it('returns an empty history for agents that send none', () => {
    expect(sanitizeNotificationHistory(undefined)).toEqual({ history: [], skipped: 0 });
    expect(sanitizeNotificationHistory(null)).toEqual({ history: [], skipped: 0 });
  });

  it('skips a history that is not an array', () => {
    expect(sanitizeNotificationHistory({ 'notif-1': [accepted] })).toEqual({ history: [], skipped: 1 });
  });

  it('skips entries without a notificationId', () => {
    const history = [null, { events: [accepted] }, { notificationId: 'notif-1', events: [accepted] }];
    expect(sanitizeNotificationHistory(history)).toEqual({
      history: [{ notificationId: 'notif-1', events: [accepted] }],
      skipped: 2
    });
  });

  it('skips events that are missing, unknown or have no valid receivedAt', () => {
    const events = [
      null,
      { event: 'credential_rejected', receivedAt: accepted.receivedAt },
      { event: 'credential_accepted' },
      { event: 'credential_accepted', receivedAt: 'yesterday' },
      { ...accepted, eventDescription: 42 },
      { ...accepted, receivedAt: '2026-11-03T10:00:07.000Z', eventDescription: 'Stored', extra: 'dropped' }
    ];
    expect(sanitizeNotificationHistory([{ notificationId: 'notif-1', events }])).toEqual({
      history: [
        {
          notificationId: 'notif-1',
          events: [accepted, { ...accepted, receivedAt: '2026-11-03T10:00:07.000Z', eventDescription: 'Stored' }]
        }
      ],
      skipped: 4
    });
  });

  it('keeps an entry whose events are not an array, with no events', () => {
    expect(sanitizeNotificationHistory([{ notificationId: 'notif-1', events: 'credential_accepted' }])).toEqual({
      history: [{ notificationId: 'notif-1', events: [] }],
      skipped: 1
    });
  });
});
