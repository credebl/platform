import { CommonModule, CommonService } from '@credebl/common';

import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemService } from './ecosystem.service';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.API_GATEWAY_NKEY_SEED, CommonConstants.ECOSYSTEM_SERVICE)
      },
      CommonModule
    ])
  ],
  controllers: [EcosystemController],
  providers: [EcosystemService, CommonService]
})
export class EcosystemModule { }

