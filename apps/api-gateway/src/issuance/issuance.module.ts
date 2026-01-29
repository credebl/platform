import { ClientsModule, Transport } from '@nestjs/microservices';

import { AwsService } from '@credebl/aws';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonService } from '@credebl/common';
import { HttpModule } from '@nestjs/axios';
import { IssuanceController } from './issuance.controller';
import { IssuanceService } from './issuance.service';
import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
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
  controllers: [IssuanceController],
  providers: [IssuanceService, CommonService, AwsService, NATSClient]
})
export class IssuanceModule {}
