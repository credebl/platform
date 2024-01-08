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
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.VERIFICATION_NKEY_SEED)

      }
    ]),

    CommonModule,
    CacheModule.register()
  ],
  controllers: [VerificationController],
  providers: [VerificationService, VerificationRepository, PrismaService, Logger, OutOfBandVerification, EmailDto]
})
export class VerificationModule { }
