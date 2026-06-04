import { Logger, Module } from '@nestjs/common';

import { CommonService } from './common.service';
import { EmailService } from './email.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [CommonService, Logger, EmailService],
  exports: [CommonService, EmailService]
})
export class CommonModule {}
