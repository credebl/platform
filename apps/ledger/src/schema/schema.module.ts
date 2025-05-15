import { Logger, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'

import { CommonModule } from '@credebl/common'
import { NATSClient } from '@credebl/common/NATSClient'
import { CommonConstants } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { PrismaService } from '@credebl/prisma-service'
import { HttpModule } from '@nestjs/axios'
import { CacheModule } from '@nestjs/cache-manager'
import { SchemaRepository } from './repositories/schema.repository'
import { SchemaController } from './schema.controller'
import { SchemaService } from './schema.service'
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.SCHEMA_SERVICE, process.env.SCHEMA_NKEY_SEED),
      },
    ]),

    HttpModule,
    CommonModule,
    CacheModule.register(),
  ],
  providers: [SchemaService, SchemaRepository, Logger, PrismaService, NATSClient],
  controllers: [SchemaController],
})
export class SchemaModule {}
