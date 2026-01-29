import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonConstants, MICRO_SERVICE_NAME } from '@credebl/common/common.constant';
import { Logger, Module } from '@nestjs/common';

import { AwsService } from '@credebl/aws';
import { BulkIssuanceProcessor } from './issuance.processor';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { CommonModule } from '@credebl/common';
import { ConfigModule } from '@nestjs/config';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { IssuanceController } from './issuance.controller';
import { IssuanceRepository } from './issuance.repository';
import { IssuanceService } from './issuance.service';
import { LoggerModule } from '@credebl/logger/logger.module';
import { NATSClient } from '@credebl/common/NATSClient';
import { OutOfBandIssuance } from '../templates/out-of-band-issuance.template';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { PrismaService } from '@credebl/prisma-service';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.ISSUANCE_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ]),
    CommonModule,
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    CacheModule.register(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT)
      }
    }),
    BullModule.registerQueue({
      name: 'bulk-issuance'
    })
  ],
  controllers: [IssuanceController],
  providers: [
    IssuanceService,
    IssuanceRepository,
    UserActivityRepository,
    PrismaService,
    Logger,
    OutOfBandIssuance,
    EmailDto,
    BulkIssuanceProcessor,
    AwsService,
    NATSClient,
    {
      provide: MICRO_SERVICE_NAME,
      useValue: 'IssuanceService'
    }
  ],
  exports: [CacheModule]
})
export class IssuanceModule {}
