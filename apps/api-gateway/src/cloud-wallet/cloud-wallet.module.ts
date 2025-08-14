import { getNatsOptions } from '@credebl/common';
import { CloudWalletController } from './cloud-wallet.controller';
import { CloudWalletService } from './cloud-wallet.service';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonConstants } from '@credebl/common';
import { NATSClient } from '@credebl/common';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.CLOUD_WALLET_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      }
    ])
  ],
  controllers: [CloudWalletController],
  providers: [CloudWalletService, NATSClient]
})
export class CloudWalletModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: CloudWalletModule,
      imports: [
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(CommonConstants.CLOUD_WALLET_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
          }
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [CloudWalletController],
      providers: [CloudWalletService, NATSClient, ...overrides]
    };
  }
}
