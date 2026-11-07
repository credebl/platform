import { ResponseMessages } from '@credebl/common/response-messages';

import { OrganizationRepository } from './organization.repository';

const ORG_ID = 'org-1';
const DID = 'did:web:example.com';
const row = { id: 'did-1', did: DID, isPrimaryDid: false, wasPrimary: false };

describe('OrganizationRepository deleteOrgDidIfAllowed', () => {
  /* eslint-disable camelcase */
  let tx: {
    org_dids: { findFirst: jest.Mock; delete: jest.Mock };
    schema: { count: jest.Mock };
    status_list_allocation: { count: jest.Mock };
    agent_invitations: { count: jest.Mock };
    $queryRaw: jest.Mock;
  };
  let repository: OrganizationRepository;

  beforeEach(() => {
    tx = {
      org_dids: { findFirst: jest.fn().mockResolvedValue(row), delete: jest.fn() },
      schema: { count: jest.fn().mockResolvedValue(0) },
      status_list_allocation: { count: jest.fn().mockResolvedValue(0) },
      agent_invitations: { count: jest.fn().mockResolvedValue(0) },
      $queryRaw: jest.fn().mockResolvedValue([{ count: BigInt(0) }])
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    const logger = { error: jest.fn() };
    repository = new OrganizationRepository(prisma as never, logger as never, null as never);
  });

  it('deletes only the org_dids row of an unused DID', async () => {
    const check = await repository.deleteOrgDidIfAllowed(ORG_ID, DID);

    expect(check).toEqual({ allowed: true, reasons: [] });
    expect(tx.org_dids.delete).toHaveBeenCalledWith({ where: { id: 'did-1' } });
    expect(tx.schema.count).toHaveBeenCalledWith({ where: { orgId: ORG_ID, publisherDid: DID } });
    expect(tx.status_list_allocation.count).toHaveBeenCalledWith({ where: { orgId: ORG_ID, issuerDid: DID } });
    expect(tx.agent_invitations.count).toHaveBeenCalledWith({ where: { orgId: ORG_ID, invitationDid: DID } });
  });

  it('keeps the row when a holder notification references the DID', async () => {
    tx.$queryRaw.mockResolvedValue([{ count: BigInt(2) }]);

    const check = await repository.deleteOrgDidIfAllowed(ORG_ID, DID);

    expect(check).toEqual({
      allowed: false,
      reasons: [ResponseMessages.organisation.error.didDeleteHolderNotifications]
    });
    expect(tx.org_dids.delete).not.toHaveBeenCalled();
  });

  it('keeps the primary DID', async () => {
    tx.org_dids.findFirst.mockResolvedValue({ ...row, isPrimaryDid: true });

    const check = await repository.deleteOrgDidIfAllowed(ORG_ID, DID);

    expect(check?.allowed).toBe(false);
    expect(tx.org_dids.delete).not.toHaveBeenCalled();
  });

  it('returns null for a DID the organization does not have', async () => {
    tx.org_dids.findFirst.mockResolvedValue(null);

    await expect(repository.deleteOrgDidIfAllowed(ORG_ID, DID)).resolves.toBeNull();
    expect(tx.org_dids.delete).not.toHaveBeenCalled();
  });
});
