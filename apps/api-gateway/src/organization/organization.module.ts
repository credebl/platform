import { CommonModule, CommonService } from '@credebl/common';

import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { getNatsOptions } from '@credebl/common';
import { AwsService } from '@credebl/aws';
import { CommonConstants } from '@credebl/common';
import { NATSClient } from '@credebl/common';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.ORGANIZATION_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      },
      CommonModule
    ])
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService, CommonService, AwsService, NATSClient]
})
export class OrganizationModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: OrganizationModule,
      imports: [
        HttpModule,
        ConfigModule.forRoot(),
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(CommonConstants.ORGANIZATION_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
          },
          CommonModule
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [OrganizationController],
      providers: [OrganizationService, CommonService, AwsService, ...overrides]
    };
  }
}
