import { AwsService } from '@credebl/aws'
import { CommonService } from '@credebl/common'
import { NATSClient } from '@credebl/common/NATSClient'
import { CommonConstants } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.USER_SERVICE, process.env.API_GATEWAY_NKEY_SEED),
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, CommonService, AwsService, NATSClient],
})
export class UserModule {}
