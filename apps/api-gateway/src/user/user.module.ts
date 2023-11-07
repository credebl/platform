import { CommonService } from '@credebl/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
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
        options: getNatsOptions()

      }
    ])
  ],
  controllers: [UserController],
  providers: [UserService, CommonService]
})
export class UserModule {}
