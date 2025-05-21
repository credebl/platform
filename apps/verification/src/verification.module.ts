import { CommonModule } from '@credebl/common'
import { NATSClient } from '@credebl/common/NATSClient'
import { CommonConstants, MICRO_SERVICE_NAME } from '@credebl/common/common.constant'
import { EmailDto } from '@credebl/common/dtos/email.dto'
import { getNatsOptions } from '@credebl/common/nats.config'
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module'
import { GlobalConfigModule } from '@credebl/config/global-config.module'
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule'
import { LoggerModule } from '@credebl/logger/logger.module'
import { PrismaService } from '@credebl/prisma-service'
import { UserActivityService } from '@credebl/user-activity'
import { CacheModule } from '@nestjs/cache-manager'
import { Logger, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { UserActivityRepository } from 'libs/user-activity/repositories'
import { OutOfBandVerification } from '../templates/out-of-band-verification.template'
import { VerificationRepository } from './repositories/verification.repository'
import { VerificationController } from './verification.controller'
import { VerificationService } from './verification.service'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.VERIFICATION_SERVICE, process.env.VERIFICATION_NKEY_SEED),
      },
    ]),

    GlobalConfigModule,
    CommonModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    CacheModule.register(),
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
      useValue: 'Verification-Service',
    },
  ],
})
export class VerificationModule {}
