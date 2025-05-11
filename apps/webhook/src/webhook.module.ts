import { CommonModule } from '@credebl/common';
import { PrismaService } from '@credebl/prisma-service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WebhookController } from './webhook.controller';
import { WebhookRepository } from './webhook.repository';
import { WebhookService } from './webhook.service';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.WEBHOOK_SERVICE, process.env.ISSUANCE_NKEY_SEED)
      }
    ]),
    CommonModule,
    GlobalConfigModule,
    LoggerModule, PlatformConfig, ContextInterceptorModule
  ],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookRepository, PrismaService, Logger]
})
export class WebhookModule {}
