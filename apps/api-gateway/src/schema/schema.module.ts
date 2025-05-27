import { ClientsModule, Transport } from '@nestjs/microservices'

import { NATSClient } from '@credebl/common/NATSClient'
import { CommonConstants } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { SchemaController } from './schema.controller'
import { SchemaService } from './schema.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.SCHEMA_SERVICE, process.env.API_GATEWAY_NKEY_SEED),
      },
    ]),
  ],
  controllers: [SchemaController],
  providers: [SchemaService, NATSClient],
})
export class SchemaModule {}
