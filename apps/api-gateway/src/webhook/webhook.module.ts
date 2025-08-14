import { ClientsModule, Transport } from '@nestjs/microservices';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
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
        options: getNatsOptions(CommonConstants.WEBHOOK_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      }
    ])
  ],
  controllers: [WebhookController],
  providers: [WebhookService, CommonService, AwsService, NATSClient]
})
export class WebhookModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: WebhookModule,
      imports: [
        HttpModule,
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(CommonConstants.WEBHOOK_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
          }
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [WebhookController],
      providers: [WebhookService, CommonService, AwsService, ...overrides]
    };
  }
}
