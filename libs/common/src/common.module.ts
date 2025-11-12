import { Logger, Module } from '@nestjs/common';

import { CommonService } from './common.service';
import { EmailService } from './email.service';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '@credebl/logger/logger.module';

@Module({
  imports: [HttpModule, LoggerModule],
  providers: [CommonService, Logger, EmailService],
  exports: [CommonService, EmailService]
})
export class CommonModule {}
