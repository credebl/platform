import { ClientsModule, Transport } from '@nestjs/microservices';

import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { getNatsOptions } from '@credebl/common/nats.config';
import { ImageServiceService } from '@credebl/image-service';
import { CommonConstants } from '@credebl/common/common.constant';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.API_GATEWAY_NKEY_SEED, CommonConstants.VERIFICATION_SERVICE)
      }
    ])
  ],
  controllers: [VerificationController],
  providers: [VerificationService, ImageServiceService]
})
export class VerificationModule { }
