import { ClientsModule, Transport } from '@nestjs/microservices';

import { AwsService } from '@credebl/aws';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonService } from '@credebl/common';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    HttpModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.WEBHOOK_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ])
  ],
  controllers: [WebhookController],
  providers: [WebhookService, CommonService, AwsService, NATSClient]
})
export class WebhookModule {}
