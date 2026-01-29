import { ClientsModule, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
import { Oid4vcIssuanceController } from './oid4vc-issuance.controller';
import { Oid4vcIssuanceService } from './oid4vc-issuance.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    HttpModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.ISSUANCE_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ])
  ],
  controllers: [Oid4vcIssuanceController],
  providers: [Oid4vcIssuanceService, NATSClient]
})
export class Oid4vcIssuanceModule {}
