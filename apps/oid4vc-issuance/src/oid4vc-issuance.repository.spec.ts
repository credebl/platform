/* eslint-disable camelcase */
import { Logger } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
import { Oid4vcIssuanceRepository } from './oid4vc-issuance.repository';

describe('Oid4vcIssuanceRepository.storeOidcCredentialDetails', () => {
  const findUnique = jest.fn();
  const upsert = jest.fn().mockResolvedValue({});
  const executeRaw = jest.fn().mockResolvedValue(1);
  const tx = { oid4vc_credentials: { findUnique, upsert }, $executeRaw: executeRaw };
  const transaction = jest.fn((run: (client: typeof tx) => Promise<unknown>) => run(tx));
  const prisma = { ...tx, $transaction: transaction } as unknown as PrismaService;
  const repository = new Oid4vcIssuanceRepository(prisma, new Logger());

  const session = {
    id: 'session-1',
    credentialOfferId: 'offer-1',
    state: 'Completed',
    contextCorrelationId: 'tenant-1',
    issuerId: 'issuer-1',
    credentialOfferPayload: { credential_configuration_ids: ['NotifSdJwt'] }
  };
  const accepted = { event: 'credential_accepted', receivedAt: '2026-11-03T10:00:06.000Z' };
  const deleted = { event: 'credential_deleted', receivedAt: '2026-11-03T11:00:00.000Z' };

  beforeEach(() => jest.clearAllMocks());

  it('stores the merged notification history without changing the state', async () => {
    findUnique.mockResolvedValue({
      notifications: [{ notificationId: 'notif-1', credentialConfigurationId: 'NotifSdJwt', events: [deleted] }]
    });
    const notifications = [{ notificationId: 'notif-1', credentialConfigurationId: 'NotifSdJwt', events: [accepted] }];

    await repository.storeOidcCredentialDetails(
      {
        oidcIssueCredentialDto: { ...session, notifications, notification: { notificationId: 'notif-1', ...accepted } }
      },
      'org-1'
    );

    const merged = { notificationId: 'notif-1', credentialConfigurationId: 'NotifSdJwt', events: [accepted, deleted] };
    const expected = [merged];
    const [[{ update, create }]] = upsert.mock.calls;
    const [[lockQuery, lockedSessionId]] = executeRaw.mock.calls;
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(lockQuery.join('?')).toContain('pg_advisory_xact_lock');
    expect(lockedSessionId).toBe('session-1');
    expect(executeRaw.mock.invocationCallOrder[0]).toBeLessThan(findUnique.mock.invocationCallOrder[0]);
    expect(findUnique).toHaveBeenCalledWith({
      where: { issuanceSessionId: 'session-1' },
      select: { notifications: true }
    });
    expect(update).toMatchObject({ state: 'Completed', notifications: expected });
    expect(create).toMatchObject({ state: 'Completed', notifications: expected });
  });

  it('leaves the notification history untouched for agents that send none', async () => {
    await repository.storeOidcCredentialDetails({ oidcIssueCredentialDto: session }, 'org-1');

    const [[{ update, create }]] = upsert.mock.calls;
    expect(transaction).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled();
    expect(update).not.toHaveProperty('notifications');
    expect(create).not.toHaveProperty('notifications');
  });
});
