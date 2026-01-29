import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CacheModule } from '@nestjs/cache-manager';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonModule } from '@credebl/common';
import { HttpModule } from '@nestjs/axios';
import { NATSClient } from '@credebl/common/NATSClient';
import { PrismaService } from '@credebl/prisma-service';
import { SchemaController } from './schema.controller';
import { SchemaRepository } from './repositories/schema.repository';
import { SchemaService } from './schema.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.SCHEMA_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ]),

    HttpModule,
    CommonModule,
    CacheModule.register()
  ],
  providers: [SchemaService, SchemaRepository, Logger, PrismaService, NATSClient],
  controllers: [SchemaController]
})
export class SchemaModule {}
