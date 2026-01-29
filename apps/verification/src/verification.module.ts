import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonConstants, MICRO_SERVICE_NAME } from '@credebl/common/common.constant';
import { Logger, Module } from '@nestjs/common';

import { CacheModule } from '@nestjs/cache-manager';
import { CommonModule } from '@credebl/common';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { NATSClient } from '@credebl/common/NATSClient';
import { OutOfBandVerification } from '../templates/out-of-band-verification.template';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { PrismaService } from '@credebl/prisma-service';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { UserActivityService } from '@credebl/user-activity';
import { VerificationController } from './verification.controller';
import { VerificationRepository } from './repositories/verification.repository';
import { VerificationService } from './verification.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.VERIFICATION_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ]),

    GlobalConfigModule,
    CommonModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    CacheModule.register()
  ],
  controllers: [VerificationController],
  providers: [
    VerificationService,
    VerificationRepository,
    PrismaService,
    UserActivityService,
    UserActivityRepository,
    Logger,
    OutOfBandVerification,
    EmailDto,
    NATSClient,
    {
      provide: MICRO_SERVICE_NAME,
      useValue: 'Verification-Service'
    }
  ]
})
export class VerificationModule {}
