import { Logger, Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@credebl/common';
import { VerificationRepository } from './repositories/verification.repository';
import { PrismaService } from '@credebl/prisma-service';
import { getNatsOptions } from '@credebl/common/nats.config';
import { OutOfBandVerification } from '../templates/out-of-band-verification.template';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { CacheModule } from '@nestjs/cache-manager';
import { UserActivityService } from '@credebl/user-activity';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { CommonConstants, MICRO_SERVICE_NAME } from '@credebl/common/common.constant';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { LoggerModule } from '@credebl/logger/logger.module';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { NATSClient } from '@credebl/common/NATSClient';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.VERIFICATION_SERVICE, process.env.VERIFICATION_NKEY_SEED)

      }
    ]),

    GlobalConfigModule,
    CommonModule, LoggerModule, PlatformConfig, ContextInterceptorModule,
    CacheModule.register()
  ],
  controllers: [VerificationController],
  providers: [
    VerificationService, VerificationRepository, PrismaService, UserActivityService, 
  UserActivityRepository, Logger, OutOfBandVerification, EmailDto, NATSClient,
  {
    provide: MICRO_SERVICE_NAME,
    useValue: 'Verification-Service'
  }
]
})
export class VerificationModule { }
