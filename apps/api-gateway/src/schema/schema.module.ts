import { ClientsModule, Transport } from '@nestjs/microservices';

import { ConfigModule } from '@nestjs/config';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { SchemaController } from './schema.controller';
import { SchemaService } from './schema.service';
import { getNatsOptions } from '@credebl/common';
import { CommonConstants } from '@credebl/common';
import { NATSClient } from '@credebl/common';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.SCHEMA_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      }
    ])
  ],
  controllers: [SchemaController],
  providers: [SchemaService, NATSClient]
})
export class SchemaModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: SchemaModule,
      imports: [
        ConfigModule.forRoot(),
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(CommonConstants.SCHEMA_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
          }
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [SchemaController],
      providers: [SchemaService, ...overrides]
    };
  }
}
