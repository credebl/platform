import { CommonModule } from '@credebl/common';
import { PrismaService } from '@credebl/prisma-service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { IssuanceController } from './issuance.controller';
import { IssuanceRepository } from './issuance.repository';
import { IssuanceService } from './issuance.service';
import { OutOfBandIssuance } from '../templates/out-of-band-issuance.template';
import { EmailDto } from '@credebl/common/dtos/email.dto';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: {
          servers: [`${process.env.NATS_URL}`]
        }
      }
    ]),
    CommonModule
  ],
  controllers: [IssuanceController],
  providers: [IssuanceService, IssuanceRepository, PrismaService, Logger, OutOfBandIssuance, EmailDto]
})
export class IssuanceModule { }
