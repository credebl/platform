/* eslint-disable @typescript-eslint/no-explicit-any, camelcase */
import { CloudWalletType } from '@credebl/enum/enum';
import { CloudWalletRepository } from './cloud-wallet.repository';

describe('CloudWalletRepository', () => {
  it('queries a holder wallet by both authenticated user id and sub-wallet type', async () => {
    const prisma = {
      cloud_wallet_user_info: {
        findFirst: jest.fn().mockResolvedValue({ id: 'holder-wallet' })
      }
    };
    const repository = new CloudWalletRepository(prisma as any, { error: jest.fn() } as any);

    await expect(repository.getCloudSubWallet('holder-user')).resolves.toEqual({ id: 'holder-wallet' });

    expect(prisma.cloud_wallet_user_info.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'holder-user',
        type: CloudWalletType.SUB_WALLET
      }
    });
  });
});
