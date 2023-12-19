/* eslint-disable array-bracket-spacing */
import { Logger, Module } from '@nestjs/common';
import { ConnectionController } from './connection.controller';
import { ConnectionService } from './connection.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@credebl/common';
import { ConnectionRepository } from './connection.repository';
import { PrismaService } from '@credebl/prisma-service';
import { CacheModule } from '@nestjs/cache-manager';
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

     CommonModule,
     CacheModule.register()
  ],
  controllers: [ConnectionController],
  providers: [ConnectionService, ConnectionRepository, PrismaService, Logger]
})
export class ConnectionModule { }
