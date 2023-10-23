import { CommonModule, CommonService } from '@credebl/common';

import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemService } from './ecosystem.service';
import { nkeyAuthenticator } from 'nats';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: {
          servers: [`${process.env.NATS_URL}`],
           authenticator: nkeyAuthenticator(new TextEncoder().encode('SUAG4DUOUYQLU2QKQUBCF74LV3CYHIHGNZVAGH4P3Q4NLBRVDZF6UZ6CNY'))
        }
      },
      CommonModule
    ])
  ],
  controllers: [EcosystemController],
  providers: [EcosystemService, CommonService]
})
export class EcosystemModule { }

