import { CommonService } from '@credebl/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { getNatsOptions } from '@credebl/common';
import { AwsService } from '@credebl/aws';
import { CommonConstants } from '@credebl/common';
import { NATSClient } from '@credebl/common';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.USER_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      }
    ])
  ],
  controllers: [UserController],
  providers: [UserService, CommonService, AwsService, NATSClient]
})
export class UserModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: UserModule,
      imports: [
        HttpModule,
        ConfigModule.forRoot(),
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(CommonConstants.USER_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
          }
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [UserController],
      providers: [UserService, CommonService, AwsService, ...overrides]
    };
  }
}
