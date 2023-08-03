import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { commonNatsOptions } from 'libs/service/nats.options';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        ...commonNatsOptions('AGENT_SERVICE:REQUESTER')
      }
    ])
    
  ],
  controllers: [PlatformController],
  providers: [PlatformService]
})
export class PlatformModule {}
