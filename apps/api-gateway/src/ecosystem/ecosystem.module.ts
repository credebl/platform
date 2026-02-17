import { ClientsModule, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemService } from './ecosystem.service';
import { EcosystemModule as EcosystemServiceModule } from 'apps/ecosystem/src/ecosystem.module';
import { IntentController } from './intent/intent.controller';
import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    EcosystemServiceModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.ECOSYSTEM_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      }
    ])
  ],
  controllers: [EcosystemController, IntentController],
  providers: [EcosystemService, NATSClient],
  exports: [EcosystemService, EcosystemServiceModule]
})
export class EcosystemModule {}
