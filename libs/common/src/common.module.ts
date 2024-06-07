import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { CommonService } from './common.service';
import { EmailService } from './email.service';

@Module({
  imports: [HttpModule],
  providers: [CommonService, EmailService],
  exports: [CommonService, EmailService]
})
export class CommonModule {}
