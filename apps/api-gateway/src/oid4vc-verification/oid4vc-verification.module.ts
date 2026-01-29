import { ClientsModule, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '@credebl/logger';
import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
import { Oid4vcVerificationController } from './oid4vc-verification.controller';
import { Oid4vcVerificationService } from './oid4vc-verification.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    HttpModule,
    LoggerModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.OIDC4VC_VERIFICATION_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ])
  ],
  controllers: [Oid4vcVerificationController],
  providers: [Oid4vcVerificationService, NATSClient]
})
export class Oid4vpModule {}
