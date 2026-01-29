import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CommonConstants } from '@credebl/common/common.constant';
import { CommonModule } from '@credebl/common';
import { ConfigModule } from '@nestjs/config';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { PrismaService } from '@credebl/prisma-service';
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
        options: getNatsOptions(CommonConstants.WEBHOOK_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ]),
    CommonModule,
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule
  ],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookRepository, PrismaService, Logger]
})
export class WebhookModule {}
