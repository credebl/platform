/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type */
import { CloudWalletType } from '@credebl/enum/enum';
import { CloudWalletService } from './cloud-wallet.service';

describe('CloudWalletService DID key import', () => {
  const ENVELOPE = { sessionId: 'session-1', jwe: 'a.b.c.d.e' };

  function createService() {
    const commonService = {
      httpPost: jest.fn().mockResolvedValue({ ok: true }),
      decryptPassword: jest.fn().mockResolvedValue('holder-token'),
      checkAgentHealth: jest.fn().mockResolvedValue(true),
      handleError: jest.fn()
    };
    const repository = {
      getCloudSubWallet: jest
        .fn()
        .mockResolvedValue({ tenantId: 'tenant-1', agentApiKey: 'enc', type: CloudWalletType.SUB_WALLET }),
      getCloudWalletDetails: jest
        .fn()
        .mockResolvedValue({ agentEndpoint: 'https://wallet-agent.example', type: CloudWalletType.BASE_WALLET })
    };
    const logger = { error: jest.fn() };
    const service = new CloudWalletService(commonService as any, repository as any, logger as any);
    return { commonService, logger, service };
  }

  it('forwards encryptedKey to the agent and strips the holder identity', async () => {
    const { commonService, service } = createService();

    await service.createDid({
      method: 'polygon',
      keyType: 'ed25519',
      network: 'polygon:testnet',
      encryptedKey: ENVELOPE,
      email: 'holder@example.test',
      userId: 'user-1'
    });

    expect(commonService.httpPost).toHaveBeenCalledWith(
      'https://wallet-agent.example/dids/write',
      { method: 'polygon', keyType: 'ed25519', network: 'polygon:testnet', encryptedKey: ENVELOPE },
      { headers: { authorization: 'holder-token' } }
    );
  });

  it('does not log the request body when creating a DID fails', async () => {
    const { commonService, logger, service } = createService();
    commonService.httpPost.mockRejectedValue({ message: 'boom', config: { data: '{"privatekey":"SECRET"}' } });

    await service.createDid({
      method: 'polygon',
      keyType: 'ed25519',
      encryptedKey: ENVELOPE,
      userId: 'user-1'
    });

    expect(JSON.stringify(logger.error.mock.calls)).not.toContain('SECRET');
    expect(commonService.handleError).toHaveBeenCalled();
  });

  it('creates the import session on the holder agent url with the holder token', async () => {
    const { commonService, service } = createService();

    await expect(
      service.createDidImportSession({ method: 'polygon', email: 'holder@example.test', userId: 'user-1' })
    ).resolves.toEqual({ ok: true });

    expect(commonService.httpPost).toHaveBeenCalledWith(
      'https://wallet-agent.example/dids/import/session',
      { method: 'polygon' },
      { headers: { authorization: 'holder-token' } }
    );
  });
});
