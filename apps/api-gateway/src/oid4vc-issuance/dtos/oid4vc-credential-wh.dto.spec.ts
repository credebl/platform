/* eslint-disable camelcase */
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { OidcIssueCredentialDto } from './oid4vc-credential-wh.dto';

describe('OidcIssueCredentialDto wallet notifications', () => {
  // Same options as the global pipe in main.ts
  const pipe = new ValidationPipe({ whitelist: true, transform: true });

  const session = {
    id: 'session-1',
    credentialOfferId: 'offer-1',
    issuedCredentials: [],
    credentialOfferPayload: { credential_configuration_ids: ['NotifSdJwt'] },
    state: 'Completed',
    createdAt: '2026-11-03T10:00:00.000Z',
    updatedAt: '2026-11-03T10:00:05.000Z',
    contextCorrelationId: 'tenant-1',
    issuerId: 'issuer-1'
  };
  const notification = {
    notificationId: 'notif-1',
    credentialConfigurationId: 'NotifSdJwt',
    event: 'credential_accepted',
    receivedAt: '2026-11-03T10:00:06.000Z'
  };
  const notifications = [
    {
      notificationId: 'notif-1',
      credentialConfigurationId: 'NotifSdJwt',
      events: [{ event: 'credential_accepted', receivedAt: '2026-11-03T10:00:06.000Z' }]
    }
  ];

  async function validate(body: object): Promise<object> {
    const dto = await pipe.transform(body, { type: 'body', metatype: OidcIssueCredentialDto });
    // What the gateway forwards to the org webhook
    return JSON.parse(JSON.stringify(dto));
  }

  it('keeps the notification and the notification history', async () => {
    const forwarded = await validate({ ...session, notification, notifications });
    expect(forwarded).toEqual({ ...session, notification, notifications });
  });

  it('keeps the event description', async () => {
    const withDescription = { ...notification, event: 'credential_failure', eventDescription: 'Could not store it' };
    const forwarded = await validate({ ...session, notification: withDescription });
    expect(forwarded).toEqual({ ...session, notification: withDescription });
  });

  it('still accepts webhooks from agents that send no notifications', async () => {
    const forwarded = await validate(session);
    expect(forwarded).toEqual(session);
  });

  it('rejects an unknown notification event', async () => {
    await expect(
      validate({ ...session, notification: { ...notification, event: 'credential_rejected' } })
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a notification without a notificationId', async () => {
    const withoutId = { ...notification, notificationId: undefined };
    await expect(validate({ ...session, notification: withoutId })).rejects.toThrow(BadRequestException);
  });

  it.each([
    ['an entry with a missing event', [{ notificationId: 'notif-1', events: [null] }]],
    ['an event without receivedAt', [{ notificationId: 'notif-1', events: [{ event: 'credential_accepted' }] }]],
    ['renamed fields', [{ id: 'notif-1', history: [{ type: 'credential_accepted', at: 1794482136000 }] }]],
    ['a history that is not an array', { 'notif-1': ['credential_accepted'] }]
  ])(
    'accepts and forwards a history with %s unchanged, so state changes are never rejected',
    async (_case, history) => {
      const forwarded = await validate({ ...session, notifications: history });
      expect(forwarded).toEqual({ ...session, notifications: history });
    }
  );
});
