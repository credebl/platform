import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HttpModule } from '@nestjs/axios';
import { Oid4vcHolderController } from './oid4vc-holder.controller';
import { Oid4vcHolderService } from './oid4vc-holder.service';

@Module({
  imports: [
    HttpModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(
          CommonConstants.OIDC4VC_HOLDER_SERVICE,
          process.env.API_GATEWAY_NKEY_SEED,
          process.env.NATS_CREDS_FILE
        )
      }
    ])
  ],
  controllers: [Oid4vcHolderController],
  providers: [Oid4vcHolderService, NATSClient]
})
export class Oid4vcHolderModule {}
