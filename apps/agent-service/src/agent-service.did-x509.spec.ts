import { HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ResponseMessages } from '@credebl/common/response-messages';

import { AgentServiceService } from './agent-service.service';
import { IDidX509Import } from './interface/agent-service.interface';

const ORG_ID = 'org-1';
const DID = 'did:x509:0:sha256:WE4P5dd8DnLHSkyHaIjhp4udlkF9LqoKwCvu9gl38jk::subject:CN:example.com';
const user = { id: 'user-1' } as never;

const importPayload: IDidX509Import = {
  certificateChain: ['leaf', 'root'],
  privateKey: '-----BEGIN PRIVATE KEY-----secret',
  policies: [{ type: 'subject', fields: { CN: 'example.com' } }],
  isPrimaryDid: false
};

const agentResponse = {
  did: DID,
  didDocument: { id: DID },
  keyId: 'jwk-thumbprint',
  verificationMethodId: `${DID}#key-1`
};

function rpcError(error: unknown): { message?: string; statusCode?: number } {
  expect(error).toBeInstanceOf(RpcException);
  return (error as RpcException).getError() as { message?: string; statusCode?: number };
}

describe('AgentServiceService did:x509', () => {
  let repository: Record<string, jest.Mock>;
  let commonService: { httpPost: jest.Mock; httpGet: jest.Mock };
  let service: AgentServiceService;

  beforeEach(() => {
    repository = {
      getOrgAgentDetails: jest.fn().mockResolvedValue({ id: 'org-agent-1', agentEndPoint: 'http://agent.test' }),
      getOrgDid: jest.fn().mockResolvedValue([]),
      storeDidDetails: jest.fn().mockImplementation(async (details) => ({ id: 'org-did-1', ...details })),
      updateIsPrimaryDid: jest.fn(),
      setPrimaryDid: jest.fn(),
      getLedger: jest.fn().mockResolvedValue({ id: 'ledger-na' }),
      updateLedgerId: jest.fn()
    };
    commonService = { httpPost: jest.fn().mockResolvedValue(agentResponse), httpGet: jest.fn() };
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

  describe('importDidX509', () => {
    it('forwards the chain to the agent and records the DID for the organization', async () => {
      const result = await service.importDidX509(importPayload, ORG_ID, user);

      const forwarded = { ...importPayload };
      delete forwarded.isPrimaryDid;
      expect(commonService.httpPost).toHaveBeenCalledWith('http://agent.test/dids/x509/import', forwarded, {
        headers: { authorization: 'agent-api-key' }
      });
      expect(repository.storeDidDetails).toHaveBeenCalledWith({
        orgId: ORG_ID,
        did: DID,
        didDocument: { id: DID },
        isPrimaryDid: false,
        orgAgentId: 'org-agent-1',
        userId: 'user-1'
      });
      expect(repository.setPrimaryDid).not.toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          did: DID,
          isPrimaryDid: false,
          keyId: 'jwk-thumbprint',
          verificationMethodId: `${DID}#key-1`
        })
      );
    });

    it('never stores the private key', async () => {
      await service.importDidX509({ ...importPayload, passphrase: 'hunter2' }, ORG_ID, user);

      const stored = JSON.stringify(repository.storeDidDetails.mock.calls);
      expect(stored).not.toContain('secret');
      expect(stored).not.toContain('hunter2');
    });

    it('returns the existing record when the same chain is imported again', async () => {
      const existing = { id: 'org-did-1', did: DID, didDocument: { id: DID }, isPrimaryDid: false };
      repository.getOrgDid.mockResolvedValue([existing]);

      const result = await service.importDidX509(importPayload, ORG_ID, user);

      expect(repository.storeDidDetails).not.toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ id: 'org-did-1', did: DID }));
    });

    it('makes the DID primary and clears the ledger when asked to', async () => {
      repository.getOrgDid.mockResolvedValue([{ id: 'org-did-0', did: 'did:key:z6Mk', isPrimaryDid: true }]);

      const result = await service.importDidX509({ ...importPayload, isPrimaryDid: true }, ORG_ID, user);

      expect(repository.updateIsPrimaryDid).toHaveBeenCalledWith(ORG_ID, false);
      expect(repository.setPrimaryDid).toHaveBeenCalledWith(DID, ORG_ID, { id: DID });
      expect(repository.updateLedgerId).toHaveBeenCalledWith(ORG_ID, 'ledger-na');
      expect(result).toEqual(expect.objectContaining({ isPrimaryDid: true }));
    });

    it('reports an agent without the did:x509 route as unsupported', async () => {
      commonService.httpPost.mockRejectedValue(
        new HttpException({ statusCode: 404, error: { message: 'Not Found' } }, HttpStatus.NOT_FOUND)
      );

      const error = await service.importDidX509(importPayload, ORG_ID, user).catch((e) => e);

      expect(rpcError(error)).toEqual(
        expect.objectContaining({ statusCode: 404, message: ResponseMessages.agent.error.didX509NotSupported })
      );
      expect(repository.storeDidDetails).not.toHaveBeenCalled();
    });

    it('does not mistake an unreachable agent for a missing route', async () => {
      commonService.httpPost.mockRejectedValue(
        new HttpException({ statusCode: 404, error: 'connect ECONNREFUSED 127.0.0.1:8001' }, HttpStatus.NOT_FOUND)
      );

      const error = await service.importDidX509(importPayload, ORG_ID, user).catch((e) => e);

      expect(rpcError(error)).toEqual({
        statusCode: 404,
        message: 'connect ECONNREFUSED 127.0.0.1:8001',
        error: 'connect ECONNREFUSED 127.0.0.1:8001'
      });
    });

    it('passes agent validation errors through', async () => {
      commonService.httpPost.mockRejectedValue(
        new HttpException(
          { statusCode: 400, error: 'privateKey does not match the leaf certificate' },
          HttpStatus.BAD_REQUEST
        )
      );

      const error = await service.importDidX509(importPayload, ORG_ID, user).catch((e) => e);

      expect(rpcError(error)).toEqual({
        statusCode: 400,
        message: 'privateKey does not match the leaf certificate',
        error: 'privateKey does not match the leaf certificate'
      });
    });

    it('hides the upstream reason of a server error', async () => {
      commonService.httpPost.mockRejectedValue(
        new HttpException(
          {
            statusCode: 500,
            message: 'Request failed with status code 500',
            error: { message: 'connect to OpenBao at http://10.0.0.5:8200 failed' }
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      );

      const error = await service.importDidX509(importPayload, ORG_ID, user).catch((e) => e);

      expect(rpcError(error)).toEqual({
        statusCode: 500,
        message: ResponseMessages.errorMessages.serverError,
        error: ResponseMessages.errorMessages.serverError
      });
    });

    it('treats an error without an HTTP status as a server error', async () => {
      commonService.httpPost.mockRejectedValue(new Error('socket hang up'));

      const error = await service.importDidX509(importPayload, ORG_ID, user).catch((e) => e);

      expect(rpcError(error)).toEqual(
        expect.objectContaining({ statusCode: 500, message: ResponseMessages.errorMessages.serverError })
      );
    });
  });

  describe('getDidX509Chain', () => {
    it('requests the chain with the DID URL-encoded', async () => {
      commonService.httpGet.mockResolvedValue({ did: DID, certificateChain: ['leaf', 'root'] });

      const result = await service.getDidX509Chain(ORG_ID, DID);

      expect(commonService.httpGet).toHaveBeenCalledWith(
        `http://agent.test/dids/x509/chain/${encodeURIComponent(DID)}`,
        { headers: { authorization: 'agent-api-key' } }
      );
      expect(result).toEqual({ did: DID, certificateChain: ['leaf', 'root'] });
    });
  });
});
