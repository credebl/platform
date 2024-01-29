import { CommonModule, CommonService } from '@credebl/common';

import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { getNatsOptions } from '@credebl/common/nats.config';
import { ImageServiceService } from '@credebl/image-service';
import { UtilitiesController } from './utilities.controller';
import { UtilitiesService } from './utilities.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.UTILITIES_NKEY_SEED)

      },
      CommonModule
    ])
  ],
  controllers: [UtilitiesController],
  providers: [UtilitiesService, CommonService, ImageServiceService]
})
export class UtilitiesModule { }

