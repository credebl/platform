import { Logger, Module } from '@nestjs/common';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemService } from './ecosystem.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@credebl/common';
import { EcosystemRepository } from './ecosystem.repository';
import { PrismaService } from '@credebl/prisma-service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: {
          servers: [`${process.env.NATS_URL}`]
        }
      }
    ]),

    CommonModule
  ],
  controllers: [EcosystemController],
  providers: [EcosystemService, PrismaService, Logger, EcosystemRepository]
})
export class EcosystemModule { }