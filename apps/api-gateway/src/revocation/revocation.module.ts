import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { RevocationService } from './revocation.service';
import { RevocationController } from './revocation.controller';
import { commonNatsOptions } from '@credebl/common';
import { NATSClient } from '@credebl/common';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        ...commonNatsOptions('REVOCATION_SERVICE:REQUESTER')
      }
    ])
  ],
  controllers: [RevocationController],
  providers: [RevocationService, NATSClient]
})
export class RevocationModule {}
