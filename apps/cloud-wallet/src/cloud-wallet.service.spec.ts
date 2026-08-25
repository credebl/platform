/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type */
import { NotFoundException } from '@nestjs/common';
import { CloudWalletType } from '@credebl/enum/enum';
import { CloudWalletService } from './cloud-wallet.service';

describe('CloudWalletService holder isolation', () => {
  const baseWallet = {
    agentEndpoint: 'https://wallet-agent.example',
    type: CloudWalletType.BASE_WALLET
  };
  const holderWallet = {
    tenantId: 'holder-tenant',
    agentApiKey: 'encrypted-holder-token',
    type: CloudWalletType.SUB_WALLET
  };

  function createService(getCloudSubWallet = jest.fn().mockResolvedValue(holderWallet)) {
    const commonService = {
      httpGet: jest.fn().mockResolvedValueOnce({ isInitialized: true }).mockResolvedValueOnce([]),
      decryptPassword: jest.fn().mockResolvedValue('holder-token')
    };
    const repository = {
      getCloudSubWallet,
      getCloudWalletDetails: jest.fn().mockResolvedValue(baseWallet)
    };
    const service = new CloudWalletService(commonService as any, repository as any, { error: jest.fn() } as any);

    return { commonService, repository, service };
  }

  it('uses the authenticated holder sub-wallet token for a normal holder operation', async () => {
    const { commonService, repository, service } = createService();

    await expect(service.getDidList({ userId: 'holder-user', email: 'holder@example.test' })).resolves.toEqual([]);

    expect(repository.getCloudSubWallet).toHaveBeenCalledWith('holder-user');
    expect(commonService.decryptPassword).toHaveBeenCalledWith('encrypted-holder-token');
    expect(commonService.httpGet).toHaveBeenLastCalledWith('https://wallet-agent.example/dids', {
      headers: { authorization: 'holder-token' }
    });
  });

  it('rejects a cross-holder lookup before resolving a base wallet', async () => {
    const { commonService, repository, service } = createService(jest.fn().mockResolvedValue(null));

    await expect(service._commonCloudWalletInfo('other-holder')).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.getCloudSubWallet).toHaveBeenCalledWith('other-holder');
    expect(repository.getCloudWalletDetails).not.toHaveBeenCalled();
    expect(commonService.decryptPassword).not.toHaveBeenCalled();
  });

  it('does not treat a base-wallet record as a holder wallet', async () => {
    const { commonService, repository, service } = createService(jest.fn().mockResolvedValue(null));

    await expect(service._commonCloudWalletInfo('base-wallet-owner')).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.getCloudWalletDetails).not.toHaveBeenCalled();
    expect(commonService.decryptPassword).not.toHaveBeenCalled();
  });
});
