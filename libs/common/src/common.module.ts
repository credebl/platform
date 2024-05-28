import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { CommonService } from './common.service';
import { EmailService } from './email.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule.forRoot()],
  providers: [CommonService, EmailService],
  exports: [CommonService, EmailService]
})
export class CommonModule {}
