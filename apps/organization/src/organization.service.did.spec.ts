import { RpcException } from '@nestjs/microservices';
import { ResponseMessages } from '@credebl/common/response-messages';

// The jest module map has no entry for this alias and the service only needs it as an injected type
jest.mock('@credebl/user-activity', () => ({ UserActivityService: class {} }), { virtual: true });

import { OrganizationService } from './organization.service';

const ORG_ID = 'org-1';
const DID = 'did:web:example.com';
const { error } = ResponseMessages.organisation;

const record = {
  id: 'did-1',
  did: DID,
  createDateTime: new Date('2026-01-01'),
  lastChangedDateTime: new Date('2026-01-02'),
  isPrimaryDid: false,
  isArchived: false,
  archivedAt: null,
  didDocument: { id: DID },
  wasPrimary: false,
  orgAgentId: 'agent-1'
};
const noUsage = { schemas: 0, statusLists: 0, holderNotifications: 0, invitations: 0 };

function rpcError(thrown: unknown): { statusCode?: number; message?: string } {
  expect(thrown).toBeInstanceOf(RpcException);
  return (thrown as RpcException).getError() as { statusCode?: number; message?: string };
}

async function failure(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (thrown) {
    return thrown;
  }
  throw new Error('expected the call to fail');
}

describe('OrganizationService DID management', () => {
  let repository: Record<string, jest.Mock>;
  let service: OrganizationService;

  beforeEach(() => {
    repository = {
      getOrgDidRecord: jest.fn().mockResolvedValue(record),
      getDidUsage: jest.fn().mockResolvedValue(noUsage),
      setDidArchived: jest.fn(),
      deleteOrgDidIfAllowed: jest.fn(),
      getOrgProfile: jest.fn().mockResolvedValue({ id: ORG_ID }),
      getAgentEndPoint: jest.fn().mockResolvedValue({ orgDid: 'did:web:primary.example.com' }),
      getAllOrganizationDid: jest.fn().mockResolvedValue([record]),
      getDidDetailsByDid: jest.fn().mockResolvedValue(record),
      getDids: jest.fn(),
      getPerviousPrimaryDid: jest.fn(),
      setPreviousDidFlase: jest.fn(),
      getLedger: jest.fn().mockResolvedValue({ id: 'ledger-na' }),
      setOrgsPrimaryDid: jest.fn()
    };
    const logger = { error: jest.fn(), log: jest.fn() };
    service = new OrganizationService(
      null as never,
      null as never,
      null as never,
      repository as never,
      null as never,
      null as never,
      null as never,
      null as never,
      logger as never,
      null as never,
      null as never,
      null as never,
      null as never,
      null as never,
      null as never
    );
  });

  describe('getOrgDidDetails', () => {
    it('returns the method, usage and an allowed deletion for an unused DID', async () => {
      const details = await service.getOrgDidDetails(ORG_ID, DID);

      expect(details).toEqual(
        expect.objectContaining({
          id: 'did-1',
          did: DID,
          method: 'web',
          isPrimaryDid: false,
          isArchived: false,
          archivedAt: null,
          didDocument: { id: DID },
          usage: { wasPrimary: false, ...noUsage },
          deletion: { allowed: true, reasons: [] }
        })
      );
      expect(details).not.toHaveProperty('orgAgentId');
    });

    it('explains why a DID that has been primary and is used cannot be deleted', async () => {
      repository.getOrgDidRecord.mockResolvedValue({ ...record, wasPrimary: true });
      repository.getDidUsage.mockResolvedValue({ ...noUsage, schemas: 3 });

      const details = await service.getOrgDidDetails(ORG_ID, DID);

      expect(details.deletion).toEqual({
        allowed: false,
        reasons: [error.didDeleteWasPrimary, error.didDeleteSchemas]
      });
    });

    it('reports a DID that is not stored for the organization as not found', async () => {
      repository.getOrgDidRecord.mockResolvedValue(null);

      expect(rpcError(await failure(service.getOrgDidDetails(ORG_ID, DID))).statusCode).toBe(404);
    });
  });

  describe('setOrgDidArchived', () => {
    it('rejects archiving the primary DID', async () => {
      repository.getOrgDidRecord.mockResolvedValue({ ...record, isPrimaryDid: true });

      const thrown = rpcError(await failure(service.setOrgDidArchived(ORG_ID, DID, true)));

      expect(thrown.statusCode).toBe(409);
      expect(thrown.message).toBe(error.didArchivePrimary);
      expect(repository.setDidArchived).not.toHaveBeenCalled();
    });

    it('archives a DID that is not primary', async () => {
      repository.setDidArchived.mockResolvedValue({ ...record, isArchived: true });

      await service.setOrgDidArchived(ORG_ID, DID, true);

      expect(repository.setDidArchived).toHaveBeenCalledWith('did-1', true);
    });

    it('leaves an archived DID untouched when it is archived again', async () => {
      const archivedAt = new Date('2026-02-01');
      repository.getOrgDidRecord.mockResolvedValue({ ...record, isArchived: true, archivedAt });

      const result = await service.setOrgDidArchived(ORG_ID, DID, true);

      expect(result).toEqual(expect.objectContaining({ isArchived: true, archivedAt }));
      expect(repository.setDidArchived).not.toHaveBeenCalled();
    });

    it('unarchives an archived DID', async () => {
      repository.getOrgDidRecord.mockResolvedValue({ ...record, isArchived: true, archivedAt: new Date() });
      repository.setDidArchived.mockResolvedValue({ ...record });

      await service.setOrgDidArchived(ORG_ID, DID, false);

      expect(repository.setDidArchived).toHaveBeenCalledWith('did-1', false);
    });
  });

  describe('deleteOrgDid', () => {
    it('returns the deleted DID', async () => {
      repository.deleteOrgDidIfAllowed.mockResolvedValue({ allowed: true, reasons: [] });

      await expect(service.deleteOrgDid(ORG_ID, DID)).resolves.toBe(DID);
    });

    it('answers 409 with the reasons when the DID is in use', async () => {
      repository.deleteOrgDidIfAllowed.mockResolvedValue({
        allowed: false,
        reasons: [error.didDeletePrimary, error.didDeleteSchemas]
      });

      const thrown = rpcError(await failure(service.deleteOrgDid(ORG_ID, DID)));

      expect(thrown.statusCode).toBe(409);
      expect(thrown.message).toContain(error.didDeletePrimary);
      expect(thrown.message).toContain(error.didDeleteSchemas);
    });

    it('answers 404 when the organization has no such DID', async () => {
      repository.deleteOrgDidIfAllowed.mockResolvedValue(null);

      expect(rpcError(await failure(service.deleteOrgDid(ORG_ID, DID))).statusCode).toBe(404);
    });
  });

  describe('setPrimaryDid', () => {
    it('rejects an archived DID with a conflict', async () => {
      repository.getAllOrganizationDid.mockResolvedValue([{ ...record, isArchived: true, archivedAt: new Date() }]);

      const thrown = rpcError(await failure(service.setPrimaryDid(ORG_ID, DID, 'did-1')));

      expect(thrown.statusCode).toBe(409);
      expect(thrown.message).toBe(error.didArchivedPrimary);
      expect(repository.setOrgsPrimaryDid).not.toHaveBeenCalled();
    });

    it('still reports a DID of another organization as not found', async () => {
      repository.getAllOrganizationDid.mockResolvedValue([]);

      expect(rpcError(await failure(service.setPrimaryDid(ORG_ID, DID, 'did-1'))).statusCode).toBe(404);
    });
  });
});
