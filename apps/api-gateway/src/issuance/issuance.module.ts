import { ClientsModule, Transport } from '@nestjs/microservices';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { IssuanceController } from './issuance.controller';
import { IssuanceService } from './issuance.service';
import { CommonService } from '@credebl/common';
import { HttpModule } from '@nestjs/axios';
import { getNatsOptions } from '@credebl/common';
import { AwsService } from '@credebl/aws';
import { CommonConstants } from '@credebl/common';
import { NATSClient } from '@credebl/common';

@Module({
  imports: [
    HttpModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.ISSUANCE_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      }
    ])
  ],
  controllers: [IssuanceController],
  providers: [IssuanceService, CommonService, AwsService, NATSClient]
})
export class IssuanceModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: IssuanceModule,
      imports: [
        HttpModule,
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(CommonConstants.ISSUANCE_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
          }
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [IssuanceController],
      providers: [IssuanceService, CommonService, AwsService, NATSClient, ...overrides]
    };
  }
}
