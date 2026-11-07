import { HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ResponseMessages } from '@credebl/common/response-messages';

import { AgentServiceService } from './agent-service.service';

const ORG_ID = 'org-1';
const DID = 'did:web:example.com';
const storedDocument = { id: DID, verificationMethod: [{ id: `${DID}#key-1`, type: 'JsonWebKey2020' }] };

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

describe('AgentServiceService resolveDid', () => {
  let repository: Record<string, jest.Mock>;
  let commonService: { httpGet: jest.Mock };
  let service: AgentServiceService;

  beforeEach(() => {
    repository = {
      getOrgDid: jest.fn().mockResolvedValue([{ did: DID, didDocument: storedDocument }]),
      getOrgAgentDetails: jest.fn().mockResolvedValue({ id: 'org-agent-1', agentEndPoint: 'http://agent.test' })
    };
    commonService = { httpGet: jest.fn() };
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

  it('resolves a stored DID through the agent and reports whether the document matches', async () => {
    const resolution = {
      didResolutionMetadata: { contentType: 'application/did+ld+json' },
      didDocumentMetadata: {},
      didDocument: { verificationMethod: [{ type: 'JsonWebKey2020', id: `${DID}#key-1` }], id: DID }
    };
    commonService.httpGet.mockResolvedValue(resolution);

    const result = await service.resolveDid(ORG_ID, DID);

    expect(commonService.httpGet).toHaveBeenCalledWith(`http://agent.test/dids/${encodeURIComponent(DID)}/resolve`, {
      headers: { authorization: 'agent-api-key' }
    });
    expect(result).toEqual({ ...resolution, source: 'local', matchesStored: true });
  });

  it('asks the agent to resolve over the network when the source is network', async () => {
    commonService.httpGet.mockResolvedValue({ didDocument: storedDocument });

    const result = await service.resolveDid(ORG_ID, DID, 'network');

    expect(commonService.httpGet).toHaveBeenCalledWith(
      `http://agent.test/dids/${encodeURIComponent(DID)}/resolve?useLocalRecord=false`,
      { headers: { authorization: 'agent-api-key' } }
    );
    expect(result).toEqual(expect.objectContaining({ source: 'network', matchesStored: true }));
  });

  it('reports a resolved document that differs from the stored one', async () => {
    commonService.httpGet.mockResolvedValue({ didDocument: { id: DID } });

    expect(await service.resolveDid(ORG_ID, DID)).toEqual(expect.objectContaining({ matchesStored: false }));
  });

  it('does not call the agent for a DID that is not stored for the organization', async () => {
    const thrown = rpcError(await failure(service.resolveDid(ORG_ID, 'did:web:other.example.com')));

    expect(thrown.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(thrown.message).toBe(ResponseMessages.organisation.error.didNotFound);
    expect(commonService.httpGet).not.toHaveBeenCalled();
  });

  it('keeps the message of a client error from the agent', async () => {
    commonService.httpGet.mockRejectedValue(
      new HttpException({ statusCode: 404, error: { message: 'DID could not be resolved' } }, 404)
    );

    const thrown = rpcError(await failure(service.resolveDid(ORG_ID, DID)));

    expect(thrown).toEqual(expect.objectContaining({ statusCode: 404, message: 'DID could not be resolved' }));
  });

  it('hides the reason of an agent server error', async () => {
    commonService.httpGet.mockRejectedValue(
      new HttpException({ statusCode: 500, error: { message: 'stack at /srv/agent/internal.js' } }, 500)
    );

    const thrown = rpcError(await failure(service.resolveDid(ORG_ID, DID)));

    expect(thrown.statusCode).toBe(500);
    expect(thrown.message).toBe(ResponseMessages.errorMessages.serverError);
  });

  it('never leaks the address of an unreachable agent', async () => {
    commonService.httpGet.mockRejectedValue(
      new HttpException({ statusCode: 404, error: 'connect ECONNREFUSED 10.0.0.7:8001' }, 404)
    );

    const thrown = rpcError(await failure(service.resolveDid(ORG_ID, DID)));

    expect(thrown.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(JSON.stringify(thrown)).not.toContain('10.0.0.7');
  });
});
