import { CommonModule, CommonService } from '@credebl/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { getNatsOptions } from '@credebl/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
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
        options: getNatsOptions(CommonConstants.NOTIFICATION_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      },
      CommonModule
    ])
  ],
  controllers: [NotificationController],
  providers: [NotificationService, CommonService, NATSClient]
})
export class NotificationModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: NotificationModule,
      imports: [
        HttpModule,
        ConfigModule.forRoot(),
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(CommonConstants.NOTIFICATION_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
          },
          CommonModule
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [NotificationController],
      providers: [NotificationService, CommonService, NATSClient, ...overrides]
    };
  }
}
