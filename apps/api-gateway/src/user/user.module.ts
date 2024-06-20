import { CommonService } from '@credebl/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { getNatsOptions } from '@credebl/common/nats.config';
import { AwsService } from '@credebl/aws';
import { CommonConstants } from '@credebl/common/common.constant';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.API_GATEWAY_NKEY_SEED, CommonConstants.USER_SERVICE)

      }
    ])
  ],
  controllers: [UserController],
  providers: [UserService, CommonService, AwsService]
})
export class UserModule {}
