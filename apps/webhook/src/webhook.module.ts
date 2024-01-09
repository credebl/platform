import { CommonModule } from '@credebl/common';
import { PrismaService } from '@credebl/prisma-service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WebhookController } from './webhook.controller';
import { WebhookRepository } from './webhook.repository';
import { WebhookService } from './webhook.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.ISSUANCE_NKEY_SEED)
      }
    ]),
    CommonModule
  ],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookRepository, PrismaService, Logger]
})
export class WebhookModule {}
