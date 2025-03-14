import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CommonModule } from '@credebl/common';
import { SchemaController } from './schema.controller';
import { SchemaRepository } from './repositories/schema.repository';
import { SchemaService } from './schema.service';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from '@credebl/prisma-service';
import { CacheModule } from '@nestjs/cache-manager';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';
import { NATSClient } from '@credebl/common/NATSClient';
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.SCHEMA_SERVICE, process.env.SCHEMA_NKEY_SEED)
      }
    ]),

    HttpModule,
    CommonModule,
    CacheModule.register()
  ],
  providers: [
    SchemaService,
    SchemaRepository,
    Logger,
    PrismaService,
    NATSClient
  ],
  controllers: [SchemaController]
})
export class SchemaModule { }
