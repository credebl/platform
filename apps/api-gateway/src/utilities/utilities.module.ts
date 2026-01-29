import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule, CommonService } from '@credebl/common';

import { CommonConstants } from '@credebl/common/common.constant';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
import { UtilitiesController } from './utilities.controller';
import { UtilitiesService } from './utilities.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.UTILITY_SERVICE, process.env.NATS_CREDS_FILE)
      },
      CommonModule
    ])
  ],
  controllers: [UtilitiesController],
  providers: [UtilitiesService, CommonService, NATSClient]
})
export class UtilitiesModule {}
