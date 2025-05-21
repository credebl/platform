import { NATSClient } from '@credebl/common/NATSClient'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ClientsModule } from '@nestjs/microservices'
import { commonNatsOptions } from 'libs/service/nats.options'
import { RevocationController } from './revocation.controller'
import { RevocationService } from './revocation.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        ...commonNatsOptions('REVOCATION_SERVICE:REQUESTER'),
      },
    ]),
  ],
  controllers: [RevocationController],
  providers: [RevocationService, NATSClient],
})
export class RevocationModule {}
