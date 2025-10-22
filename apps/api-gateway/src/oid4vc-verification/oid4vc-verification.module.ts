import { Module } from '@nestjs/common';
import { Oid4vcVerificationService } from './oid4vc-verification.service';
import { Oid4vcVerificationController } from './oid4vc-verification.controller';
import { NATSClient } from '@credebl/common/NATSClient';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.ISSUANCE_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      }
    ])
  ],
  controllers: [Oid4vcVerificationController],
  providers: [Oid4vcVerificationService, NATSClient]
})
export class Oid4vpModule {}
