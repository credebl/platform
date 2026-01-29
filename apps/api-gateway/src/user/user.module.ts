import { ClientsModule, Transport } from '@nestjs/microservices';

import { AwsService } from '@credebl/aws';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonService } from '@credebl/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.USER_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ])
  ],
  controllers: [UserController],
  providers: [UserService, CommonService, AwsService, NATSClient]
})
export class UserModule {}
