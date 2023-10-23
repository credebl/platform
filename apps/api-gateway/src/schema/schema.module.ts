import { ClientsModule, Transport } from '@nestjs/microservices';

import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { SchemaController } from './schema.controller';
import { SchemaService } from './schema.service';
// import { nkeyAuthenticator } from 'nats';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: {
          servers: [`${process.env.NATS_URL}`]
        //   authenticator: nkeyAuthenticator(new TextEncoder().encode(process.env.API_GATEWAY_NKEY_SEED)),
         }
      }
    ])
  ],
  controllers: [SchemaController],
  providers: [SchemaService]
})
export class SchemaModule { }
