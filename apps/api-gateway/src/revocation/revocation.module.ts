import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Transport, ClientsModule } from '@nestjs/microservices';
import { RevocationService } from './revocation.service';
import { RevocationController } from './revocation.controller';
import { commonNatsOptions } from 'libs/service/nats.options';

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
    providers: [RevocationService]
})
export class RevocationModule {

}
