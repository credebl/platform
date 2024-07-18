
import { ICreateCloudWallet, IGetStoredWalletInfo, IStoredWalletDetails } from '@credebl/common/interfaces/cloud-wallet.interface';
import { Inject, Injectable} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { CloudBaseWalletConfigureDto } from './dtos/configure-base-wallet.dto';
import { user } from '@prisma/client';

@Injectable()
export class CloudWalletService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly cloudWalletServiceProxy: ClientProxy) {
    super('CloudWalletServiceProxy');
  }

  configureBaseWallet(
    cloudBaseWalletConfigure: CloudBaseWalletConfigureDto,
    user: user
  ): Promise<IGetStoredWalletInfo> {
    const payload = {cloudBaseWalletConfigure, user};
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'configure-cloud-base-wallet', payload);
  }

  createCloudWallet(
    cloudWalletDetails: ICreateCloudWallet
  ): Promise<IStoredWalletDetails> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'create-cloud-wallet', cloudWalletDetails);
  }


}
