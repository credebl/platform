/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { AgentServiceService } from './agent-service.service';
import { AgentServiceRepository } from './repositories/agent-service.repository';
import { PrismaService } from '@credebl/prisma-service';
import { CommonService } from '@credebl/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { NATSClient } from '@credebl/common/NATSClient';
import { RpcException } from '@nestjs/microservices';
import { ResponseMessages } from '@credebl/common/response-messages';
import { DidMethod } from '@credebl/enum/enum';

describe('AgentServiceService - createDid duplicate handling', () => {
  let service: AgentServiceService;
  let commonService: Partial<CommonService>;
  let agentServiceRepository: Partial<AgentServiceRepository>;

  beforeEach(async () => {
    commonService = {
      httpPost: jest.fn(),
      decryptPassword: jest.fn().mockResolvedValue('decrypted-api-key')
    };

    agentServiceRepository = {
      getOrgAgentDetails: jest.fn().mockResolvedValue({
        id: 'agent-id-1',
        agentEndPoint: 'http://localhost:3000',
        ledgerId: null,
        apiKey: 'encrypted-api-key'
      }),
      getLedgerByNameSpace: jest.fn().mockResolvedValue({ id: 'ledger-id-1' }),
      getOrgDid: jest.fn().mockResolvedValue([]),
      storeDidDetails: jest.fn(),
      updateIsPrimaryDid: jest.fn(),
      setPrimaryDid: jest.fn(),
      getLedger: jest.fn().mockResolvedValue({ id: 'ledger-id-1' }),
      updateLedgerId: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentServiceService,
        { provide: AgentServiceRepository, useValue: agentServiceRepository },
        { provide: PrismaService, useValue: {} },
        { provide: CommonService, useValue: commonService },
        { provide: 'NATS_CLIENT', useValue: { send: jest.fn() } },
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn() } },
        { provide: UserActivityRepository, useValue: {} },
        { provide: NATSClient, useValue: {} }
      ]
    }).compile();

    service = module.get<AgentServiceService>(AgentServiceService);
    jest.spyOn(service, 'getOrgAgentApiKey').mockResolvedValue('test-api-key');
  });

  const mockPayload = {
    seed: '12345678901234567890123456789012',
    keyType: 'ed25519',
    method: DidMethod.INDY,
    network: 'indicio:demonet',
    role: 'endorser',
    isPrimaryDid: false
  };

  const mockUser = {
    id: 'user-id-1',
    email: 'test@example.com'
  } as any;

  it('should throw 409 Conflict with "DID already exist" when Credo returns "CredoError: Key already exists"', async () => {
    (commonService.httpPost as jest.Mock).mockRejectedValue({
      response: {
        status: 500,
        error: 'CredoError: Key already exists'
      }
    });

    try {
      await service.createDid(mockPayload as any, 'org-id-1', mockUser);
      fail('Expected RpcException to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(RpcException);
      const rpcError = error.getError();
      expect(rpcError).toEqual({
        statusCode: 409,
        message: ResponseMessages.agent.error.didAlreadyExist,
        error: 'Conflict'
      });
    }
  });

  it('should throw 409 Conflict when DID already exists in organization wallet database', async () => {
    (commonService.httpPost as jest.Mock).mockResolvedValue({
      did: 'did:indy:indicio:demonet:existing-did',
      didDocument: {}
    });

    (agentServiceRepository.getOrgDid as jest.Mock).mockResolvedValue([{ did: 'did:indy:indicio:demonet:existing-did' }]);

    try {
      await service.createDid(mockPayload as any, 'org-id-1', mockUser);
      fail('Expected RpcException to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(RpcException);
      const rpcError = error.getError();
      expect(rpcError).toEqual({
        statusCode: 409,
        message: ResponseMessages.agent.error.didAlreadyExist,
        error: 'Conflict'
      });
    }
  });
});
