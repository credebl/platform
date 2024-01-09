import { ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { CommonService } from '@credebl/common';
import { HttpModule } from '@nestjs/axios';
import { getNatsOptions } from '@credebl/common/nats.config';
import { AwsService } from '@credebl/aws';

@Module({
  imports: [
    HttpModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.API_GATEWAY_NKEY_SEED)
      }
    ])
  ],
  controllers: [WebhookController],
  providers: [WebhookService, CommonService, AwsService]
})
export class WebhookModule { }
