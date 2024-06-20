import { CommonModule, CommonService } from '@credebl/common';

import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { getNatsOptions } from '@credebl/common/nats.config';
import { ImageServiceService } from '@credebl/image-service';
import { UtilitiesController } from './utilities.controller';
import { UtilitiesService } from './utilities.service';
import { CommonConstants } from '@credebl/common/common.constant';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.API_GATEWAY_NKEY_SEED, CommonConstants.UTILITY_SERVICE)

      },
      CommonModule
    ])
  ],
  controllers: [UtilitiesController],
  providers: [UtilitiesService, CommonService, ImageServiceService]
})
export class UtilitiesModule { }

