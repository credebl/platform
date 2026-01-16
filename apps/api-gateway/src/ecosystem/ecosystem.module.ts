import { ClientsModule, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemService } from './ecosystem.service';
import { EcosystemModule as EcosystemServiceModule } from 'apps/ecosystem/src/ecosystem.module';
import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
import { PlatformModule } from '../platform/platform.module';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    PlatformModule,
    EcosystemServiceModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.ECOSYSTEM_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      }
    ])
  ],
  controllers: [EcosystemController],
  providers: [EcosystemService, NATSClient]
})
export class EcosystemModule {}
