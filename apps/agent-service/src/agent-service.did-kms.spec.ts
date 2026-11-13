import { HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ResponseMessages } from '@credebl/common/response-messages';

import { AgentServiceService } from './agent-service.service';

const ORG_ID = 'org-1';
const DID = 'did:web:example.com';
const user = { id: 'user-1' } as never;
const keys = [{ didDocumentRelativeKeyId: '#key-1', kmsKeyId: 'ob_abc', kmsBackend: 'openbao' }];

function rpcError(error: unknown): { message?: string; statusCode?: number } {
  expect(error).toBeInstanceOf(RpcException);
  return (error as RpcException).getError() as { message?: string; statusCode?: number };
}

async function failure(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('expected the call to fail');
}

describe('AgentServiceService KMS backend of a DID', () => {
  let repository: Record<string, jest.Mock>;
  let commonService: { httpGet: jest.Mock; httpPost: jest.Mock };
  let service: AgentServiceService;

  beforeEach(() => {
    repository = {
      getOrgDid: jest.fn().mockResolvedValue([{ did: DID, kmsBackend: null }]),
      getOrgAgentDetails: jest.fn().mockResolvedValue({ id: 'org-agent-1', agentEndPoint: 'http://agent.test' }),
      storeDidDetails: jest.fn().mockImplementation(async (details) => ({ id: 'org-did-1', ...details })),
      updateDidKmsBackend: jest.fn()
    };
    commonService = { httpGet: jest.fn(), httpPost: jest.fn() };
    service = new AgentServiceService(
      repository as never,
      null as never,
      commonService as never,
      null as never,
      null as never,
      null as never,
      null as never
    );
    jest.spyOn(service, 'getOrgAgentApiKey').mockResolvedValue('agent-api-key');
  });

  describe('createDid', () => {
    const payload = { method: 'web', domain: 'example.com', isPrimaryDid: false } as never;

    beforeEach(() => repository.getOrgDid.mockResolvedValue([]));

    it('stores the KMS backend the agent reports', async () => {
      commonService.httpPost.mockResolvedValue({ did: DID, didDocument: { id: DID }, kmsBackend: 'node', keys: [] });

      await service.createDid(payload, ORG_ID, user);

      expect(repository.storeDidDetails).toHaveBeenCalledWith(expect.objectContaining({ kmsBackend: 'node' }));
    });

    it('stores null for an unknown backend value or when the agent reports none', async () => {
      commonService.httpPost.mockResolvedValue({ did: DID, didDocument: { id: DID }, kmsBackend: 'vault' });
      await service.createDid(payload, ORG_ID, user);
      expect(repository.storeDidDetails).toHaveBeenLastCalledWith(expect.objectContaining({ kmsBackend: null }));

      commonService.httpPost.mockResolvedValue({ did: DID, didDocument: { id: DID } });
      await service.createDid(payload, ORG_ID, user);
      expect(repository.storeDidDetails).toHaveBeenLastCalledWith(expect.objectContaining({ kmsBackend: null }));
    });
  });

  describe('getDidKms', () => {
    it('persists the backend reported by the agent and returns it with the keys', async () => {
      commonService.httpGet.mockResolvedValue({ did: DID, kmsBackend: 'openbao', keys });

      const result = await service.getDidKms(ORG_ID, DID);

      expect(commonService.httpGet).toHaveBeenCalledWith(`http://agent.test/dids/${encodeURIComponent(DID)}/kms`, {
        headers: { authorization: 'agent-api-key' }
      });
      expect(repository.updateDidKmsBackend).toHaveBeenCalledWith(ORG_ID, DID, 'openbao');
      expect(result).toEqual({ did: DID, kmsBackend: 'openbao', keys });
    });

    it('overwrites a different stored backend but does not rewrite an equal one', async () => {
      commonService.httpGet.mockResolvedValue({ did: DID, kmsBackend: 'mixed', keys });
      repository.getOrgDid.mockResolvedValue([{ did: DID, kmsBackend: 'askar' }]);
      await service.getDidKms(ORG_ID, DID);
      expect(repository.updateDidKmsBackend).toHaveBeenCalledWith(ORG_ID, DID, 'mixed');

      repository.updateDidKmsBackend.mockClear();
      repository.getOrgDid.mockResolvedValue([{ did: DID, kmsBackend: 'mixed' }]);
      await service.getDidKms(ORG_ID, DID);
      expect(repository.updateDidKmsBackend).not.toHaveBeenCalled();
    });

    it('answers unknown when the agent has no KMS route', async () => {
      commonService.httpGet.mockRejectedValue(new HttpException({ statusCode: 404, error: 'Not Found' }, 404));

      const result = await service.getDidKms(ORG_ID, DID);

      expect(result).toEqual({ did: DID, kmsBackend: null, keys: [] });
      expect(repository.updateDidKmsBackend).not.toHaveBeenCalled();
    });

    it('answers unknown when the agent reports no or an unknown backend', async () => {
      commonService.httpGet.mockResolvedValue({ did: DID, kmsBackend: null, keys: [] });
      expect(await service.getDidKms(ORG_ID, DID)).toEqual({ did: DID, kmsBackend: null, keys: [] });

      commonService.httpGet.mockResolvedValue({ did: DID, kmsBackend: 'vault', keys });
      expect(await service.getDidKms(ORG_ID, DID)).toEqual({ did: DID, kmsBackend: null, keys: [] });
      expect(repository.updateDidKmsBackend).not.toHaveBeenCalled();
    });

    it('does not call the agent for a DID that is not stored for the organization', async () => {
      const thrown = rpcError(await failure(service.getDidKms(ORG_ID, 'did:web:other.example.com')));

      expect(thrown.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(thrown.message).toBe(ResponseMessages.organisation.error.didNotFound);
      expect(commonService.httpGet).not.toHaveBeenCalled();
    });

    it('reports an unreachable agent as unavailable instead of unknown', async () => {
      commonService.httpGet.mockRejectedValue(
        new HttpException({ statusCode: 404, error: 'connect ECONNREFUSED 10.0.0.7:8001' }, 404)
      );

      const thrown = rpcError(await failure(service.getDidKms(ORG_ID, DID)));

      expect(thrown.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    });
  });
});
