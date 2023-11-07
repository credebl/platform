import { CommonModule } from '@credebl/common';
import { PrismaService } from '@credebl/prisma-service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { IssuanceController } from './issuance.controller';
import { IssuanceRepository } from './issuance.repository';
import { IssuanceService } from './issuance.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions()
      }
    ]),
    CommonModule
  ],
  controllers: [IssuanceController],
  providers: [IssuanceService, IssuanceRepository, PrismaService, Logger]
})
export class IssuanceModule { }
