import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CommonModule } from '@credebl/common';
import { SchemaController } from './schema.controller';
import { SchemaRepository } from './repositories/schema.repository';
import { SchemaService } from './schema.service';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from '@credebl/prisma-service';
import { getNatsOptions } from '@credebl/common/nats.config';
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.SCHEMA_NKEY_SEED)
      }
    ]),

    HttpModule,
    CommonModule
  ],
  providers: [
    SchemaService,
    SchemaRepository,
    Logger,
    PrismaService
  ],
  controllers: [SchemaController]
})
export class SchemaModule { }
