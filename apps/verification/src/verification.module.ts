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
import { CommonConstants } from '@credebl/common/common.constant';
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.VERIFICATION_SERVICE, process.env.VERIFICATION_NKEY_SEED)

      }
    ]),

    CommonModule,
    CacheModule.register()
  ],
  controllers: [VerificationController],
  providers: [VerificationService, VerificationRepository, PrismaService, UserActivityService, UserActivityRepository, Logger, OutOfBandVerification, EmailDto]
})
export class VerificationModule { }
