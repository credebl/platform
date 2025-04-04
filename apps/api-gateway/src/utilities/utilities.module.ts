import { CommonModule, CommonService } from '@credebl/common';

import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { getNatsOptions } from '@credebl/common/nats.config';
import { UtilitiesController } from './utilities.controller';
import { UtilitiesService } from './utilities.service';
import { CommonConstants } from '@credebl/common/common.constant';
import { NATSClient } from '@credebl/common/NATSClient';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.UTILITY_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      },
      CommonModule
    ])
  ],
  controllers: [UtilitiesController],
  providers: [UtilitiesService, CommonService, NATSClient]
})
export class UtilitiesModule {}
