import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CacheModule } from '@nestjs/cache-manager';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonModule } from '@credebl/common';
import { ConfigModule } from '@nestjs/config';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { NotificationController } from './notification.controller';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { PrismaService } from '@credebl/prisma-service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.NOTIFICATION_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ]),
    CommonModule,
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    CacheModule.register({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT })
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository, PrismaService, Logger]
})
export class NotificationModule {}
