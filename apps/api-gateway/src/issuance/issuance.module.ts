import { ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from '@nestjs/common';
import { IssuanceController } from './issuance.controller';
import { IssuanceService } from './issuance.service';
import { CommonService } from '@credebl/common';
import { HttpModule } from '@nestjs/axios';
import { getNatsOptions } from '@credebl/common/nats.config';
import { ImageServiceService } from '@credebl/image-service';
import { AwsService } from '@credebl/aws';
import { CommonConstants } from '@credebl/common/common.constant';

@Module({
  imports: [
    HttpModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.API_GATEWAY_NKEY_SEED, CommonConstants.ISSUANCE_SERVICE)
      }
    ])
  ],
  controllers: [IssuanceController],
  providers: [IssuanceService, ImageServiceService, CommonService, AwsService]
})
export class IssuanceModule { }
