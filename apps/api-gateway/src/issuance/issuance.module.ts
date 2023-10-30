import { ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from '@nestjs/common';
import { IssuanceController } from './issuance.controller';
import { IssuanceService } from './issuance.service';
import { CommonService } from '@credebl/common';
import { HttpModule } from '@nestjs/axios';
import { ImageServiceService } from '@credebl/image-service';

@Module({
  imports: [
    HttpModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: {
          servers: [`${process.env.NATS_URL}`]
        }
      }
    ])
  ],
  controllers: [IssuanceController],
  providers: [IssuanceService, ImageServiceService, CommonService]
})
export class IssuanceModule { }
