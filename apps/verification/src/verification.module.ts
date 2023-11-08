import { Logger, Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@credebl/common';
import { VerificationRepository } from './repositories/verification.repository';
import { PrismaService } from '@credebl/prisma-service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.VERIFICATION_NKEY_SEED)

      }
    ]),

    CommonModule
  ],
  controllers: [VerificationController],
  providers: [VerificationService, VerificationRepository, PrismaService, Logger, OutOfBandVerification, EmailDto]
})
export class VerificationModule { }
