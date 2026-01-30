import { ClientsModule, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { ConfigModule } from '@nestjs/config';
import { EcosystemModule as EcosystemServiceModule } from 'apps/ecosystem/src/ecosystem.module';
import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    EcosystemServiceModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.PLATFORM_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      }
    ])
  ],
  controllers: [PlatformController],
  providers: [PlatformService, NATSClient],
  exports: [EcosystemServiceModule]
})
export class PlatformModule {}
