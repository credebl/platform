import { Module } from '@nestjs/common';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';
import { SchemaModule } from './schema/schema.module';
import { PrismaService } from '@credebl/prisma-service';
import { CredentialDefinitionModule } from './credential-definition/credential-definition.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

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
    SchemaModule, CredentialDefinitionModule
],
  controllers: [LedgerController],
  providers: [LedgerService, PrismaService]
})
export class LedgerModule { }
