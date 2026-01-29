import { ClientsModule, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.VERIFICATION_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ])
  ],
  controllers: [VerificationController],
  providers: [VerificationService, NATSClient]
})
export class VerificationModule {}
